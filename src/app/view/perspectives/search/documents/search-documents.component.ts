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

import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {distinctUntilChanged, filter, map, mergeMap, take, tap} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {selectCurrentQueryDocumentsLoaded} from '../../../../core/store/documents/documents.state';
import {selectQuery} from '../../../../core/store/navigation/navigation.state';
import {User} from '../../../../core/store/users/user';
import {selectAllUsers, selectCurrentUser} from '../../../../core/store/users/users.state';
import {Collection} from '../../../../core/store/collections/collection';
import {selectCollectionsByQuery, selectDocumentsByQuery} from '../../../../core/store/common/permissions.selectors';
import {Query} from '../../../../core/store/navigation/query/query';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {DEFAULT_SEARCH_ID, SearchConfig, SearchDocumentsConfig} from '../../../../core/store/searches/search';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {selectSearchConfig, selectSearchId} from '../../../../core/store/searches/searches.state';
import {SearchesAction} from '../../../../core/store/searches/searches.action';
import {sortDocumentsByFavoriteAndLastUsed} from '../../../../core/store/documents/document.utils';
import {selectWorkspaceWithIds} from '../../../../core/store/common/common.selectors';
import {Organization} from '../../../../core/store/organizations/organization';
import {Project} from '../../../../core/store/projects/project';
import {selectOrganizationByWorkspace} from '../../../../core/store/organizations/organizations.state';
import {selectProjectByWorkspace} from '../../../../core/store/projects/projects.state';
import {selectConstraintData} from '../../../../core/store/constraint-data/constraint-data.state';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {queryWithoutFilters} from '../../../../core/store/navigation/query/query.util';
import {ViewsAction} from '../../../../core/store/views/views.action';
import {Perspective} from '../../perspective';

const PAGE_SIZE = 40;

@Component({
  selector: 'search-documents',
  templateUrl: './search-documents.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchDocumentsComponent implements OnInit, OnDestroy {
  @Input()
  public maxLines: number = -1;

  public constraintData$: Observable<ConstraintData>;
  public documentsConfig$: Observable<SearchDocumentsConfig>;
  public documents$: Observable<DocumentModel[]>;
  public collections$: Observable<Collection[]>;
  public loaded$: Observable<boolean>;
  public query$: Observable<Query>;
  public users$: Observable<User[]>;
  public workspace$: Observable<Workspace>;
  public currentUser$: Observable<User>;
  public organization$: Observable<Organization>;
  public project$: Observable<Project>;

  private searchId: string;
  private config: SearchConfig;
  private documentsOrder = [];
  private subscriptions = new Subscription();
  private page$ = new BehaviorSubject<number>(0);

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.users$ = this.store$.pipe(select(selectAllUsers));
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.loaded$ = this.store$.pipe(select(selectCurrentQueryDocumentsLoaded));
    this.query$ = this.store$.pipe(select(selectQuery));
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.documentsConfig$ = this.selectDocumentsConfig$();
    this.currentUser$ = this.store$.pipe(select(selectCurrentUser));
    this.organization$ = this.store$.pipe(select(selectOrganizationByWorkspace));
    this.project$ = this.store$.pipe(select(selectProjectByWorkspace));
    this.constraintData$ = this.store$.pipe(select(selectConstraintData));
    this.documents$ = this.subscribeDocuments$();

    this.subscribeSearchId();
    this.subscribeQueryChange();
  }

  private subscribeSearchId() {
    this.store$
      .pipe(
        select(selectSearchId),
        take(1)
      )
      .subscribe(searchId => (this.searchId = searchId));
  }

  private selectDocumentsConfig$(): Observable<SearchDocumentsConfig> {
    return this.store$.pipe(
      select(selectSearchConfig),
      tap(config => (this.config = config)),
      map(config => config && config.documents)
    );
  }

  private subscribeDocuments$(): Observable<DocumentModel[]> {
    const pageObservable = this.page$.asObservable();
    return this.store$.pipe(
      select(selectDocumentsByQuery),
      map(documents => sortDocumentsByFavoriteAndLastUsed(documents)),
      mergeMap(documents =>
        pageObservable.pipe(
          map(page => (documents || []).slice(0, PAGE_SIZE * (page + 1))),
          map(sortedDocuments => this.mapNewDocuments(sortedDocuments))
        )
      )
    );
  }

  private mapNewDocuments(documents: DocumentModel[]): DocumentModel[] {
    const documentsMap = documents.reduce((acc, doc) => {
      acc[doc.correlationId || doc.id] = doc;
      return acc;
    }, {});

    const orderedDocuments = this.documentsOrder.reduce((acc, key) => {
      const doc = documentsMap[key];
      if (doc) {
        acc.push(doc);
        delete documentsMap[key];
      }
      return acc;
    }, []);

    for (const [key, value] of Object.entries(documentsMap)) {
      orderedDocuments.push(value);
      this.documentsOrder.push(key);
    }

    return orderedDocuments;
  }

  public configChange(documentsConfig: SearchDocumentsConfig) {
    if (this.searchId) {
      const searchConfig = {...this.config, documents: documentsConfig};
      this.store$.dispatch(new SearchesAction.SetConfig({searchId: this.searchId, config: searchConfig}));
      if (this.searchId === DEFAULT_SEARCH_ID) {
        this.store$.dispatch(
          new ViewsAction.SetDefaultConfig({
            model: {
              collectionId: DEFAULT_SEARCH_ID,
              perspective: Perspective.Search,
              config: {search: searchConfig},
            },
          })
        );
      }
    }
  }

  public onFetchNextPage() {
    this.page$.next(this.page$.value + 1);
    this.store$
      .pipe(
        select(selectQuery),
        take(1)
      )
      .subscribe(query => {
        this.fetchDocuments(query);
      });
  }

  private fetchDocuments(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query: this.getPaginationQuery(query)}));
  }

  private getPaginationQuery(query: Query): Query {
    return {...query, page: this.page$.value, pageSize: PAGE_SIZE};
  }

  private subscribeQueryChange() {
    const navigationSubscription = this.store$
      .pipe(
        select(selectQuery),
        filter(query => !!query),
        distinctUntilChanged((a, b) => deepObjectsEquals(queryWithoutFilters(a), queryWithoutFilters(b)))
      )
      .subscribe(query => {
        this.clearDocumentsInfo();
        this.fetchDocuments(query);
      });
    this.subscriptions.add(navigationSubscription);
  }

  private clearDocumentsInfo() {
    this.documentsOrder = [];
    this.page$.next(0);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
