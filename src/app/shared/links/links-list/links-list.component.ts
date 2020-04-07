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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  SimpleChange,
  OnChanges,
  OnInit,
} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {LinkType} from '../../../core/store/link-types/link.type';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {selectLinkTypesByCollectionId} from '../../../core/store/common/permissions.selectors';
import {selectCollectionsDictionary} from '../../../core/store/collections/collections.state';
import {distinctUntilChanged, map, mergeMap, tap} from 'rxjs/operators';
import {Query} from '../../../core/store/navigation/query/query';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {getOtherLinkedCollectionId} from '../../utils/link-type.utils';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {CollectionPermissionsPipe} from '../../pipes/permissions/collection-permissions.pipe';
import {deepObjectsEquals} from '../../utils/common.utils';

@Component({
  selector: 'links-list',
  templateUrl: './links-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListComponent implements OnChanges, OnInit {
  @Input()
  public collection: Collection;

  @Input()
  public document: DocumentModel;

  @Input()
  public preventEventBubble: boolean;

  @Output()
  public documentSelect = new EventEmitter<{collection: Collection; document: DocumentModel}>();

  public selectedLinkType$ = new BehaviorSubject<LinkType>(null);

  public linkTypes$: Observable<LinkType[]>;
  public otherCollection$: Observable<Collection>;
  public permissions$: Observable<AllowedPermissions>;
  public query$: Observable<Query>;

  public constructor(private store$: Store<AppState>, private collectionPermissionsPipe: CollectionPermissionsPipe) {}

  public ngOnInit() {
    this.query$ = this.store$.pipe(select(selectQuery));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.objectChanged(changes.collection)) {
      this.renewSubscriptions();
    }
    if (this.objectChanged(changes.document)) {
      this.selectedLinkType$.value && this.selectOtherCollection(this.selectedLinkType$.value);
    }
  }

  private renewSubscriptions() {
    this.linkTypes$ = combineLatest([
      this.store$.pipe(select(selectLinkTypesByCollectionId(this.collection.id))),
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
      ),
      tap(linkTypes => this.initActiveLinkType(linkTypes))
    );
  }

  private objectChanged(change: SimpleChange): boolean {
    return change && (!change.previousValue || change.previousValue.id !== change.currentValue?.id);
  }

  private initActiveLinkType(linkTypes: LinkType[]) {
    let selectLinkType: LinkType;
    if (this.selectedLinkType$.value) {
      selectLinkType = linkTypes.find(linkType => linkType.id === this.selectedLinkType$.value.id);
    }

    this.onSelectLink(selectLinkType || linkTypes[0]);
  }

  public onSelectLink(linkType: LinkType) {
    this.selectedLinkType$.next(linkType);
    this.selectOtherCollection(linkType);

    if (linkType) {
      this.readData(linkType);
    }
  }

  private selectOtherCollection(linkType: LinkType) {
    this.otherCollection$ = this.store$.pipe(
      select(selectCollectionsDictionary),
      map(collectionsMap => {
        const collectionId = getOtherLinkedCollectionId(linkType, this.document?.collectionId);
        return collectionId && collectionsMap[collectionId];
      })
    );
    this.permissions$ = this.otherCollection$.pipe(
      mergeMap(collection => this.collectionPermissionsPipe.transform(collection)),
      distinctUntilChanged((a, b) => deepObjectsEquals(a, b))
    );
  }

  private readData(linkType: LinkType) {
    if (linkType) {
      const otherCollectionId = getOtherLinkedCollectionId(linkType, this.collection.id);
      const documentsQuery: Query = {stems: [{collectionId: otherCollectionId}]};
      this.store$.dispatch(new DocumentsAction.Get({query: documentsQuery}));
      const query: Query = {stems: [{collectionId: this.collection.id, linkTypeIds: [linkType.id]}]};
      this.store$.dispatch(new LinkInstancesAction.Get({query}));
    }
  }

  public unLinkDocument(linkInstance: LinkInstance) {
    this.store$.dispatch(new LinkInstancesAction.Delete({linkInstanceId: linkInstance.id}));
  }

  public onSelectDocument(data: {collection: Collection; document: DocumentModel}) {
    this.documentSelect.emit(data);
  }
}
