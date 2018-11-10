/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';

import {Store} from '@ngrx/store';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {AppState} from '../../../../core/store/app.state';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {BehaviorSubject, combineLatest as observableCombineLatest, Observable, Subscription} from 'rxjs';
import {LinkTypeModel} from '../../../../core/store/link-types/link-type.model';
import {
  selectCollectionByWorkspace,
  selectCollectionsDictionary,
} from '../../../../core/store/collections/collections.state';
import {filter, map, mergeMap, tap} from 'rxjs/operators';
import {selectLinkTypesByCollectionId} from '../../../../core/store/common/permissions.selectors';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {LinkTypesAction} from '../../../../core/store/link-types/link-types.action';
import {LinkInstancesAction} from '../../../../core/store/link-instances/link-instances.action';
import {isNullOrUndefined} from 'util';

@Component({
  templateUrl: './collection-link-types.component.html',
  styleUrls: ['./collection-link-types.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionLinkTypesComponent implements OnInit, OnDestroy {
  public linkTypes$: Observable<LinkTypeModel[]>;
  public collection$: Observable<CollectionModel>;
  public searchString$ = new BehaviorSubject<string>('');

  private subscriptions = new Subscription();

  constructor(private i18n: I18n, private notificationService: NotificationService, private store: Store<AppState>) {}

  public ngOnInit() {
    this.subscribeData();
  }

  private subscribeData() {
    this.linkTypes$ = this.store.select(selectCollectionByWorkspace).pipe(
      filter(collection => !!collection),
      mergeMap(collection => this.selectLinkTypesForCollection(collection.id))
    );

    this.collection$ = this.store
      .select(selectCollectionByWorkspace)
      .pipe(filter(collection => !isNullOrUndefined(collection)));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private selectLinkTypesForCollection(collectionId: string): Observable<LinkTypeModel[]> {
    return observableCombineLatest(
      this.store.select(selectLinkTypesByCollectionId(collectionId)),
      this.store.select(selectCollectionsDictionary)
    ).pipe(
      map(([linkTypes, collectionsMap]) =>
        linkTypes.map(linkType => {
          const collections: [CollectionModel, CollectionModel] = [
            collectionsMap[linkType.collectionIds[0]],
            collectionsMap[linkType.collectionIds[1]],
          ];
          return {...linkType, collections};
        })
      ),
      tap(linkTypes => this.fetchLinkInstances(linkTypes))
    );
  }

  private fetchLinkInstances(linkTypes: LinkTypeModel[]) {
    const query = {linkTypeIds: linkTypes.map(link => link.id)};
    this.store.dispatch(new LinkInstancesAction.Get({query}));
  }

  public onSearchInputChanged(newString: string) {
    this.searchString$.next(newString);
  }

  public onDeleteLinkType(linkType: LinkTypeModel, usageCount: number) {
    if (usageCount === 0) {
      this.deleteLinkType(linkType);
    } else {
      this.confirmDeletionLinkType(linkType);
    }
  }

  private confirmDeletionLinkType(linkType: LinkTypeModel) {
    const title = this.i18n({id: 'collection.tab.linktypes.delete.title', value: 'Delete link type?'});
    const message = this.i18n(
      {
        id: 'collection.tab.linktypes.delete.message',
        value: 'Do you really want to delete the link type "{{name}}" and all its usages?',
      },
      {
        name: linkType.name,
      }
    );
    const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
    const noButtonText = this.i18n({id: 'button.no', value: 'No'});

    this.notificationService.confirm(message, title, [
      {text: noButtonText},
      {text: yesButtonText, action: () => this.deleteLinkType(linkType), bold: false},
    ]);
  }

  private deleteLinkType(linkType: LinkTypeModel) {
    this.store.dispatch(new LinkTypesAction.Delete({linkTypeId: linkType.id}));
  }

  public trackByLinkType(linkType: LinkTypeModel, index: number): string {
    return linkType.id;
  }
}
