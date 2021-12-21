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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {LinkInstancesAction} from '../../../core/store/link-instances/link-instances.action';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {NavigationAction} from '../../../core/store/navigation/navigation.action';
import {Query} from '../../../core/store/navigation/query/query';
import {BehaviorSubject, combineLatest, Observable, of, Subscription} from 'rxjs';
import {selectCollectionById} from '../../../core/store/collections/collections.state';
import {
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs/operators';
import {selectDocumentById, selectQueryDocumentsLoaded} from '../../../core/store/documents/documents.state';
import {selectNavigatingToOtherWorkspace, selectViewCursor} from '../../../core/store/navigation/navigation.state';
import {AllowedPermissionsMap} from '../../../core/model/allowed-permissions';
import {
  selectCollectionPermissionsByView,
  selectCollectionsByCustomQueryWithoutLinks,
  selectCollectionsPermissionsByView,
  selectDocumentsByViewAndCustomQuery,
  selectReadableCollectionsByView,
} from '../../../core/store/common/permissions.selectors';
import {
  filterStemsForCollection,
  getBaseCollectionIdsFromQuery,
  getQueryFiltersForCollection,
  queryContainsOnlyFulltexts,
  queryIsEmpty,
} from '../../../core/store/navigation/query/query.util';
import {DocumentsAction} from '../../../core/store/documents/documents.action';
import {ViewCursor, viewCursorsAreSame} from '../../../core/store/navigation/view-cursor/view-cursor';
import {selectViewDataQuery, selectViewSettings} from '../../../core/store/view-settings/view-settings.state';
import {View, ViewSettings} from '../../../core/store/views/view';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {generateDocumentData} from '../../../core/store/documents/document.utils';
import {createFlatResourcesSettingsQuery, modifyDetailPerspectiveQuery} from '../../../core/store/details/detail.utils';
import {DataQuery} from '../../../core/model/data-query';
import {defaultDetailPerspectiveConfiguration, DetailPerspectiveConfiguration} from '../perspective-configuration';
import {selectCurrentView} from '../../../core/store/views/views.state';

@Component({
  selector: 'detail-perspective',
  templateUrl: './detail-perspective.component.html',
  styleUrls: ['./detail-perspective.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DetailPerspectiveComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public view: View;

  @Input()
  public perspectiveConfiguration: DetailPerspectiveConfiguration = defaultDetailPerspectiveConfiguration;

  public query$: Observable<Query>;
  public currentView$: Observable<View>;
  public viewSettings$: Observable<ViewSettings>;
  public permissions$: Observable<AllowedPermissionsMap>;
  public settingsQuery$: Observable<Query>;
  public selected$: Observable<{collection?: Collection; document?: DocumentModel}>;
  public viewCursor$: Observable<ViewCursor>;

  public creatingDocument$ = new BehaviorSubject(false);
  public overrideView$ = new BehaviorSubject<View>(null);
  public overrideCursor$ = new BehaviorSubject<ViewCursor>(null);

  public isEmbedded: boolean;

  private query: Query;
  private currentView: View;
  private collection: Collection;
  private createdDocuments: string[] = [];
  private subscriptions = new Subscription();

  public constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.initSubscriptions();
    this.subscribeData();
    this.initSelection();
  }

  private initSubscriptions() {
    this.currentView$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return of(view);
        }
        return this.store$.pipe(select(selectCurrentView));
      }),
      tap(currentView => (this.currentView = currentView))
    );

    this.query$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return of(view.query);
        }
        return this.store$.pipe(select(selectViewDataQuery));
      })
    );
  }

  private subscribeData() {
    this.viewSettings$ = this.currentView$.pipe(
      switchMap(view => (this.isEmbedded ? of(view?.settings) : this.store$.pipe(select(selectViewSettings))))
    );
    this.viewCursor$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return this.overrideCursor$.asObservable();
        }
        return this.store$.pipe(
          select(selectViewCursor),
          distinctUntilChanged((a, b) => viewCursorsAreSame(a, b))
        );
      })
    );
    this.settingsQuery$ = this.currentView$.pipe(
      switchMap(view => this.store$.pipe(select(selectReadableCollectionsByView(view)))),
      map(collections => createFlatResourcesSettingsQuery(collections))
    );
    this.permissions$ = this.currentView$.pipe(
      switchMap(view => this.store$.pipe(select(selectCollectionsPermissionsByView(view))))
    );
    this.subscriptions.add(
      combineLatest([
        this.currentView$.pipe(
          map(view => view?.id),
          distinctUntilChanged()
        ),
        this.query$,
      ]).subscribe(([viewId, query]) => this.onQueryChanged(query, viewId))
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.view) {
      this.overrideView$.next(this.view);
    }
    this.isEmbedded = !!this.view;
  }

  private onQueryChanged(query: DataQuery, viewId: string) {
    this.query = query;

    if (queryContainsOnlyFulltexts(query)) {
      this.store$.dispatch(new DocumentsAction.Get({query, workspace: {viewId}}));
    }
  }

  private initSelection() {
    this.selected$ = combineLatest([this.currentView$, this.viewCursor$, this.query$]).pipe(
      debounceTime(10),
      switchMap(([view, cursor, query]) => this.appendCollectionsToData(view, cursor, query)),
      switchMap(({view, cursor, query, collections}) => {
        return this.selectCollectionByCursor$(cursor, query, view).pipe(
          switchMap(({collection}) => {
            if (collection || collections[0]) {
              return this.selectByCollection$(collection || collections[0], query, cursor, view);
            }
            return of({collection: null, document: null});
          }),
          withLatestFrom(this.store$.pipe(select(selectNavigatingToOtherWorkspace))),
          filter(([, navigating]) => !navigating),
          map(([selection]) => selection),
          tap(selection => this.emitCursor(selection.collection, selection.document, cursor))
        );
      })
    );
  }

  private appendCollectionsToData(
    view: View,
    cursor: ViewCursor,
    query: Query
  ): Observable<{view: View; cursor: ViewCursor; query: Query; collections: Collection[]}> {
    return this.store$.pipe(
      select(selectCollectionsByCustomQueryWithoutLinks(view, query)),
      map(collections => ({view, cursor, query: modifyDetailPerspectiveQuery(query, collections), collections}))
    );
  }

  private emitCursor(collection: Collection, document: DocumentModel, cursor: ViewCursor) {
    if (collection?.id !== cursor?.collectionId || document?.id !== cursor?.documentId) {
      this.emit(collection, document);
    } else if (collection) {
      this.collection = collection;
    }
  }

  private selectCollectionByCursor$(
    cursor: ViewCursor,
    query: Query,
    view: View
  ): Observable<{collection?: Collection}> {
    return combineLatest([
      this.store$.pipe(select(selectCollectionById(cursor?.collectionId))),
      this.store$.pipe(select(selectCollectionPermissionsByView(view, cursor?.collectionId))),
    ]).pipe(
      map(([collection, permissions]) => {
        const baseCollectionIds = getBaseCollectionIdsFromQuery(query);
        if (collection && baseCollectionIds.includes(collection.id) && permissions?.rolesWithView?.Read) {
          return {collection};
        }
        return {};
      }),
      distinctUntilChanged((a, b) => a.collection?.id === b.collection?.id)
    );
  }

  private selectByCollection$(
    collection: Collection,
    query: Query,
    cursor: ViewCursor,
    view: View
  ): Observable<{collection?: Collection; document?: DocumentModel}> {
    const collectionQuery = filterStemsForCollection(collection.id, query);
    return this.store$.pipe(
      select(selectQueryDocumentsLoaded(collectionQuery)),
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new DocumentsAction.Get({query: collectionQuery, workspace: {viewId: view?.id}}));
        }
      }),
      filter(loaded => loaded),
      mergeMap(() => this.store$.pipe(select(selectDocumentsByViewAndCustomQuery(view, collectionQuery)))),
      switchMap(documents => {
        if (cursor?.documentId) {
          const documentByCursor = documents.find(doc => doc.id === cursor.documentId);
          if (documentByCursor) {
            return of(documentByCursor);
          }
          if (this.createdDocuments.includes(cursor.documentId)) {
            return this.store$.pipe(
              select(selectDocumentById(cursor.documentId)),
              map(document => document || documents[0])
            );
          }
        }
        return of(documents[0]);
      }),
      map(document => ({collection, document}))
    );
  }

  public selectCollection(collection: Collection) {
    combineLatest([this.currentView$, this.query$])
      .pipe(
        switchMap(([view, query]) => {
          const collectionQuery = filterStemsForCollection(collection.id, query);
          return this.store$.pipe(
            select(selectQueryDocumentsLoaded(collectionQuery)),
            tap(loaded => {
              if (!loaded) {
                this.store$.dispatch(new DocumentsAction.Get({query: collectionQuery, workspace: {viewId: view?.id}}));
              }
            }),
            filter(loaded => loaded),
            mergeMap(() =>
              this.store$.pipe(
                select(selectDocumentsByViewAndCustomQuery(view, collectionQuery)),
                map(documents => documents?.[0])
              )
            )
          );
        }),
        take(1)
      )
      .subscribe(document => this.emit(collection, document));
  }

  public onCreatedDocument(document: DocumentModel) {
    this.createdDocuments.push(document.id);
    this.selectDocument(document);
  }

  public selectDocument(document: DocumentModel) {
    this.emit(this.collection, document);
    this.loadLinkInstances(document, this.currentView?.id);
  }

  public selectCollectionAndDocument(data: {collection: Collection; document: DocumentModel}) {
    const currentQueryIsEmpty = queryIsEmpty(this.query);
    const query: Query = currentQueryIsEmpty ? null : {stems: [{collectionId: data.collection.id}]};
    this.emit(data.collection, data.document, query);
  }

  private emit(selectedCollection: Collection, selectedDocument: DocumentModel, query?: Query) {
    if (!selectedCollection) {
      return;
    }

    const cursor: ViewCursor = {
      collectionId: selectedCollection.id,
      documentId: selectedDocument?.id,
    };

    this.collection = selectedCollection;

    if (this.isEmbedded) {
      this.overrideCursor$.next(cursor);
    } else if (query) {
      this.store$.dispatch(new NavigationAction.RemoveViewFromUrl({setQuery: query, cursor}));
    } else {
      this.store$.dispatch(new NavigationAction.SetViewCursor({cursor}));
    }
  }

  private loadLinkInstances(document: DocumentModel, viewId: string) {
    if (document) {
      const query: Query = {stems: [{collectionId: document.collectionId, documentIds: [document.id]}]};
      this.store$.dispatch(new LinkInstancesAction.Get({query, workspace: {viewId}}));
    }
  }

  public addDocument() {
    const collection = this.collection;
    if (collection) {
      combineLatest([this.query$, this.store$.pipe(select(selectConstraintData)), this.currentView$])
        .pipe(take(1))
        .subscribe(([query, constraintData, view]) => {
          const queryFilters = getQueryFiltersForCollection(query, collection.id);
          const data = generateDocumentData(collection, queryFilters, constraintData, true);
          const document = {data, collectionId: collection.id};

          this.creatingDocument$.next(true);

          this.store$.dispatch(
            new DocumentsAction.Create({
              document,
              workspace: {viewId: view?.id},
              onSuccess: () => this.creatingDocument$.next(false),
              onFailure: () => this.creatingDocument$.next(false),
              afterSuccess: createdDocument => this.onCreatedDocument(createdDocument),
            })
          );
        });
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
