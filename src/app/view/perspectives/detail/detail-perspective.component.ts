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

import {ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';
import {Query} from '../../../core/store/navigation/query';
import {BehaviorSubject, Observable, of, Subscription} from 'rxjs';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {distinctUntilChanged, map, mergeMap} from 'rxjs/operators';
import {selectDocumentById} from '../../../core/store/documents/documents.state';
import {selectQuery} from '../../../core/store/navigation/navigation.state';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {CollectionPermissionsPipe} from '../../../shared/pipes/permissions/collection-permissions.pipe';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';

@Component({
  selector: 'detail-perspective',
  templateUrl: './detail-perspective.component.html',
  styleUrls: ['./detail-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPerspectiveComponent implements OnInit, OnDestroy {
  @Input()
  public embedded: boolean;

  public query$: Observable<Query>;
  public collectionPermission$: Observable<AllowedPermissions>;

  public selected$ = new BehaviorSubject<{collection?: Collection; document?: DocumentModel}>({});
  private selectedCollection: Collection;
  private collectionSubscription = new Subscription();

  public constructor(private store$: Store<AppState>, private collectionPermissionsPipe: CollectionPermissionsPipe) {}

  public ngOnInit() {
    this.query$ = this.store$.pipe(select(selectQuery));
  }

  public ngOnDestroy() {
    this.collectionSubscription.unsubscribe();
  }

  public selectCollection(collection: Collection) {
    this.select(collection, undefined);
  }

  public selectDocument(document: DocumentModel) {
    this.select(this.selectedCollection, document);
    this.loadLinkInstances(document);
  }

  public selectCollectionAndDocument(data: {collection: Collection; document: DocumentModel}) {
    const {collection, document} = data;
    this.setQueryWithCollection(collection);
    this.select(collection, document);
  }

  private select(collection: Collection, document?: DocumentModel) {
    this.selectedCollection = collection;
    this.collectionPermission$ = this.collectionPermissionsPipe
      .transform(collection)
      .pipe(distinctUntilChanged((a, b) => deepObjectsEquals(a, b)));

    this.collectionSubscription.unsubscribe();
    this.collectionSubscription = this.store$
      .pipe(
        select(selectCollectionById(collection.id)),
        mergeMap(coll => {
          if (document) {
            return this.store$.pipe(
              select(selectDocumentById(document.id)),
              map(doc => ({collection: coll, document: doc}))
            );
          }
          return of({collection: coll, document});
        })
      )
      .subscribe(selected => this.emit(selected));
  }

  private emit(selected: {collection: Collection; document?: DocumentModel}) {
    setTimeout(() => {
      this.selected$.next(selected);
    });
  }

  private loadLinkInstances(document: DocumentModel) {
    if (document) {
      const query: Query = {stems: [{collectionId: document.collectionId, documentIds: [document.id]}]};
      this.store$.dispatch(new LinkInstancesAction.Get({query}));
    }
  }

  private setQueryWithCollection(collection: Collection) {
    const query: Query = {stems: [{collectionId: collection.id}]};
    this.store$.dispatch(new NavigationAction.RemoveViewFromUrl({setQuery: query}));
  }
}
