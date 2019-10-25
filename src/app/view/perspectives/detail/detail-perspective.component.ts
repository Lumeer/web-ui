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
import {Query} from '../../../core/store/navigation/query/query';
import {BehaviorSubject, combineLatest, Observable, of, Subscription} from 'rxjs';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {distinctUntilChanged, filter, map, mergeMap, take, tap} from 'rxjs/operators';
import {selectDocumentById, selectQueryDocumentsLoaded} from '../../../core/store/documents/documents.state';
import {selectQuery, selectViewCursor, selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {CollectionPermissionsPipe} from '../../../shared/pipes/permissions/collection-permissions.pipe';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';
import {
  selectCollectionsByQueryWithoutLinks,
  selectDocumentsByCustomQuery,
} from '../../../core/store/common/permissions.selectors';
import {filterStemsForCollection} from '../../../core/store/navigation/query/query.util';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {Workspace} from '../../../core/store/navigation/workspace';

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
  public workspace$: Observable<Workspace>;

  public selected$ = new BehaviorSubject<{collection?: Collection; document?: DocumentModel}>({});

  private collectionSubscription = new Subscription();
  private subscriptions = new Subscription();

  public constructor(private store$: Store<AppState>, private collectionPermissionsPipe: CollectionPermissionsPipe) {}

  public ngOnInit() {
    this.query$ = this.store$.pipe(select(selectQuery));
    this.workspace$ = this.store$.pipe(select(selectWorkspace));
    this.initSelection();
  }

  private initSelection() {
    const subscription = combineLatest([
      this.store$.pipe(select(selectCollectionsByQueryWithoutLinks)),
      this.store$.pipe(select(selectQuery)),
      this.store$.pipe(select(selectViewCursor)),
    ])
      .pipe(
        mergeMap(([collections, query, cursor]) => {
          const selectedCollection =
            (cursor && (collections || []).find(coll => coll.id === cursor.collectionId)) ||
            (collections && collections[0]);
          if (selectedCollection) {
            const collectionQuery = filterStemsForCollection(selectedCollection.id, query);
            this.store$.dispatch(new DocumentsAction.Get({query: collectionQuery}));
            return this.store$.pipe(
              select(selectDocumentsByCustomQuery(collectionQuery)),
              map(documents => {
                const document =
                  (cursor && (documents || []).find(doc => doc.id === cursor.documentId)) ||
                  (documents && documents[0]);
                return {collection: selectedCollection, document};
              })
            );
          }
          return of({collection: null, document: null});
        })
      )
      .subscribe(({collection, document}) => {
        if (collection) {
          const selectedCollection = this.selected$.value.collection;
          const selectedDocument = this.selected$.value.document;

          const collectionIsSame = selectedCollection && collection.id === selectedCollection.id;
          const documentIsSame = selectedDocument && document && document.id === selectedDocument.id;

          if (!collectionIsSame || !documentIsSame) {
            this.select(collection, document);
          }
        } else {
          this.selected$.next({});
        }
      });
    this.subscriptions.add(subscription);
  }

  public ngOnDestroy() {
    this.collectionSubscription.unsubscribe();
    this.subscriptions.unsubscribe();
  }

  public selectCollection(collection: Collection) {
    const subscription = this.store$
      .pipe(
        select(selectQuery),
        mergeMap(query => {
          const collectionQuery = filterStemsForCollection(collection.id, query);
          return this.store$.pipe(
            select(selectQueryDocumentsLoaded(collectionQuery)),
            tap(loaded => {
              if (!loaded) {
                this.store$.dispatch(new DocumentsAction.Get({query: collectionQuery}));
              }
            }),
            filter(loaded => loaded),
            mergeMap(() =>
              this.store$.pipe(
                select(selectDocumentsByCustomQuery(collectionQuery)),
                map(documents => documents && documents[0])
              )
            )
          );
        }),
        take(1)
      )
      .subscribe(document => this.select(collection, document));
    this.subscriptions.add(subscription);
  }

  public selectDocument(document: DocumentModel) {
    this.select(this.selected$.value.collection, document);
    this.loadLinkInstances(document);
  }

  public selectCollectionAndDocument(data: {collection: Collection; document: DocumentModel}) {
    this.setQueryWithCollection(data.collection);
    this.select(data.collection, data.document);
  }

  private select(selectedCollection: Collection, selectedDocument: DocumentModel) {
    this.collectionPermission$ = this.collectionPermissionsPipe
      .transform(selectedCollection)
      .pipe(distinctUntilChanged((a, b) => deepObjectsEquals(a, b)));

    this.collectionSubscription.unsubscribe();
    this.collectionSubscription = combineLatest([
      this.store$.pipe(select(selectCollectionById(selectedCollection.id))),
      selectedDocument ? this.store$.pipe(select(selectDocumentById(selectedDocument.id))) : of(null),
    ]).subscribe(([collection, document]) => {
      if (collection) {
        this.selected$.next({collection, document});
      }
    });

    this.store$.dispatch(
      new NavigationAction.SetViewCursor({
        cursor: {collectionId: selectedCollection.id, documentId: selectedDocument && selectedDocument.id},
      })
    );
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
