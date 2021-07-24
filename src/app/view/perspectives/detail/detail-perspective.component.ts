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
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';
import {Query} from '../../../core/store/navigation/query/query';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {filter, map, mergeMap, switchMap, take, tap} from 'rxjs/operators';
import {selectDocumentById, selectQueryDocumentsLoaded} from '../../../core/store/documents/documents.state';
import {selectQuery, selectViewCursor} from '../../../core/store/navigation/navigation.state';
import {AllowedPermissionsMap} from '../../../core/model/allowed-permissions';
import {
  selectCollectionsByQueryWithoutLinks,
  selectReadableCollections,
  selectDocumentsByCustomQuery,
} from '../../../core/store/common/permissions.selectors';
import {
  filterStemsForCollection,
  getBaseCollectionIdsFromQuery,
  getQueryFiltersForCollection,
  queryContainsOnlyFulltexts,
  queryIsEmpty,
} from '../../../core/store/navigation/query/query.util';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {ViewCursor} from '../../../core/store/navigation/view-cursor/view-cursor';
import {
  selectCollectionPermissions,
  selectCollectionsPermissions,
} from '../../../core/store/user-permissions/user-permissions.state';
import {selectViewDataQuery, selectViewSettings} from '../../../core/store/view-settings/view-settings.state';
import {DataQuery} from '../../../core/model/data-query';
import {ViewSettings} from '../../../core/store/views/view';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {generateDocumentData} from '../../../core/store/documents/document.utils';
import {createFlatResourcesSettingsQuery} from '../../../core/store/details/detail.utils';
import {selectCurrentUserForWorkspace} from '../../../core/store/users/users.state';
import {userCanReadDocument} from '../../../shared/utils/permission.utils';

@Component({
  selector: 'detail-perspective',
  templateUrl: './detail-perspective.component.html',
  styleUrls: ['./detail-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPerspectiveComponent implements OnInit {
  public query$: Observable<Query>;
  public viewSettings$: Observable<ViewSettings>;
  public permissions$: Observable<AllowedPermissionsMap>;
  public settingsQuery$: Observable<Query>;
  public selected$: Observable<{collection?: Collection; document?: DocumentModel}>;

  public creatingDocument$ = new BehaviorSubject(false);

  private query: Query;
  private collection: Collection;

  public constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.settingsQuery$ = this.store$.pipe(
      select(selectReadableCollections),
      map(collections => createFlatResourcesSettingsQuery(collections))
    );
    this.viewSettings$ = this.store$.pipe(select(selectViewSettings));
    this.permissions$ = this.store$.pipe(select(selectCollectionsPermissions));

    /////////////////////////

    this.query$ = this.store$.pipe(
      select(selectViewDataQuery),
      tap(query => this.onQueryChanged(query))
    );
    this.initSelection();
  }

  private onQueryChanged(query: DataQuery) {
    this.query = query;

    if (queryContainsOnlyFulltexts(query)) {
      this.store$.dispatch(new DocumentsAction.Get({query}));
    }
  }

  private initSelection() {
    this.selected$ = combineLatest([
      this.store$.pipe(select(selectViewCursor)),
      this.store$.pipe(select(selectQuery)),
    ]).pipe(
      switchMap(([cursor, query]) =>
        this.selectByCursor$(cursor, query).pipe(
          switchMap(({collection, document}) => {
            if (collection && document) {
              return of({collection, document});
            } else if (collection) {
              return this.selectByCollection$(collection, query);
            }
            return this.store$.pipe(
              select(selectCollectionsByQueryWithoutLinks),
              switchMap(collections => this.selectByCollection$(collections[0], query))
            );
          }),
          tap(selection => this.emitCursor(selection.collection, selection.document, cursor))
        )
      )
    );
  }

  private emitCursor(collection: Collection, document: DocumentModel, cursor: ViewCursor) {
    if (collection?.id !== cursor?.collectionId || document?.id !== cursor?.documentId) {
      this.emit(collection, document);
    }
  }

  private selectByCursor$(
    cursor: ViewCursor,
    query: Query
  ): Observable<{collection?: Collection; document?: DocumentModel}> {
    return combineLatest([
      this.store$.pipe(select(selectCollectionById(cursor?.collectionId))),
      this.store$.pipe(select(selectCollectionPermissions(cursor?.collectionId))),
      this.store$.pipe(select(selectDocumentById(cursor?.documentId))),
      this.store$.pipe(select(selectCurrentUserForWorkspace)),
    ]).pipe(
      map(([collection, permissions, document, currentUser]) => {
        const baseCollectionIds = getBaseCollectionIdsFromQuery(query);
        if (collection && baseCollectionIds.includes(collection.id) && permissions?.rolesWithView?.Read) {
          if (document && userCanReadDocument(document, collection, permissions, currentUser)) {
            return {collection, document};
          }
          return {collection};
        }
        return {};
      })
    );
  }

  private selectByCollection$(
    collection: Collection,
    query: Query
  ): Observable<{collection?: Collection; document?: DocumentModel}> {
    const collectionQuery = filterStemsForCollection(collection.id, query);
    this.store$.dispatch(new DocumentsAction.Get({query: collectionQuery}));
    return this.store$.pipe(
      select(selectDocumentsByCustomQuery(collectionQuery)),
      map(documents => {
        return {collection, document: documents?.[0]};
      })
    );
  }

  public selectCollection(collection: Collection) {
    this.store$
      .pipe(
        select(selectViewDataQuery),
        switchMap(query => {
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
                map(documents => documents?.[0])
              )
            )
          );
        }),
        take(1)
      )
      .subscribe(document => this.emit(collection, document));
  }

  public selectDocument(document: DocumentModel) {
    this.emit(this.collection, document);
    this.loadLinkInstances(document);
  }

  public selectCollectionAndDocument(data: {collection: Collection; document: DocumentModel}) {
    const currentQueryIsEmpty = queryIsEmpty(this.query);
    const query: Query = currentQueryIsEmpty ? null : {stems: [{collectionId: data.collection.id}]};
    this.emit(data.collection, data.document, query);
  }

  private emit(selectedCollection: Collection, selectedDocument: DocumentModel, query?: Query) {
    const cursor: ViewCursor = {
      collectionId: selectedCollection.id,
      documentId: selectedDocument?.id,
    };

    if (query) {
      this.store$.dispatch(new NavigationAction.RemoveViewFromUrl({setQuery: query, cursor}));
    } else {
      this.store$.dispatch(new NavigationAction.SetViewCursor({cursor}));
    }
  }

  private loadLinkInstances(document: DocumentModel) {
    if (document) {
      const query: Query = {stems: [{collectionId: document.collectionId, documentIds: [document.id]}]};
      this.store$.dispatch(new LinkInstancesAction.Get({query}));
    }
  }

  public addDocument() {
    const collection = this.collection;
    if (collection) {
      combineLatest([this.store$.pipe(select(selectViewDataQuery)), this.store$.pipe(select(selectConstraintData))])
        .pipe(take(1))
        .subscribe(([query, constraintData]) => {
          const queryFilters = getQueryFiltersForCollection(query, collection.id);
          const data = generateDocumentData(collection, queryFilters, constraintData, true);
          const document = {data, collectionId: collection.id};

          this.creatingDocument$.next(true);

          this.store$.dispatch(
            new DocumentsAction.Create({
              document,
              onSuccess: () => this.creatingDocument$.next(false),
              onFailure: () => this.creatingDocument$.next(false),
              afterSuccess: createdDocument => this.selectDocument(createdDocument),
            })
          );
        });
    }
  }
}
