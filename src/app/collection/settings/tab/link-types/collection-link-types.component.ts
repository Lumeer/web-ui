/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

import {select, Store} from '@ngrx/store';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {AppState} from '../../../../core/store/app.state';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {
  selectCollectionByWorkspace,
  selectCollectionsDictionary,
} from '../../../../core/store/collections/collections.state';
import {filter, map, mergeMap} from 'rxjs/operators';
import {selectLinkTypesByCollectionId} from '../../../../core/store/common/permissions.selectors';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkTypesAction} from '../../../../core/store/link-types/link-types.action';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';

@Component({
  templateUrl: './collection-link-types.component.html',
  styleUrls: ['./collection-link-types.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionLinkTypesComponent implements OnInit {
  public linkTypes$: Observable<LinkType[]>;
  public collection$: Observable<Collection>;
  public searchString$ = new BehaviorSubject<string>('');

  constructor(private notificationService: NotificationService, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.subscribeData();
  }

  private subscribeData() {
    this.linkTypes$ = this.store$.select(selectCollectionByWorkspace).pipe(
      filter(collection => !!collection),
      mergeMap(collection => this.selectLinkTypesForCollection(collection.id))
    );

    this.collection$ = this.store$
      .select(selectCollectionByWorkspace)
      .pipe(filter(collection => isNotNullOrUndefined(collection)));
  }

  private selectLinkTypesForCollection(collectionId: string): Observable<LinkType[]> {
    return combineLatest([
      this.store$.pipe(select(selectLinkTypesByCollectionId(collectionId))),
      this.store$.pipe(select(selectCollectionsDictionary)),
    ]).pipe(
      map(([linkTypes, collectionsMap]) =>
        linkTypes.map(linkType => {
          const collections: [Collection, Collection] = [
            collectionsMap[linkType.collectionIds[0]],
            collectionsMap[linkType.collectionIds[1]],
          ];
          return {...linkType, collections};
        })
      )
    );
  }

  public onSearchInputChanged(newString: string) {
    this.searchString$.next(newString);
  }

  public onDeleteLinkType(linkType: LinkType, usageCount: number) {
    if (usageCount === 0) {
      this.deleteLinkType(linkType);
    } else {
      this.confirmDeletionLinkType(linkType);
    }
  }

  private confirmDeletionLinkType(linkType: LinkType) {
    const title = $localize`:@@collection.tab.linktypes.delete.title:Delete link type?`;
    const message = $localize`:@@collection.tab.linktypes.delete.message:Do you really want to delete the link type "${linkType.name}:name:" and all its usages?`;
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.deleteLinkType(linkType));
  }

  private deleteLinkType(linkType: LinkType) {
    this.store$.dispatch(new LinkTypesAction.Delete({linkTypeId: linkType.id}));
  }

  public trackByLinkType(index: number, linkType: LinkType): string {
    return linkType.id;
  }

  public onNewName(linkType: LinkType, name: string) {
    const newLinkType = {...linkType, name};
    this.store$.dispatch(new LinkTypesAction.Update({linkType: newLinkType}));
  }

  public updateLinkType(linkType: LinkType): void {
    this.store$.dispatch(new LinkTypesAction.Update({linkType}));
  }
}
