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
import {Observable, Subscription} from 'rxjs';
import {distinctUntilChanged, filter, map, take, tap} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';
import {selectCurrentQueryDocumentsLoaded} from '../../../../core/store/documents/documents.state';
import {selectQuery} from '../../../../core/store/navigation/navigation.state';
import {User} from '../../../../core/store/users/user';
import {selectAllUsers, selectCurrentUser} from '../../../../core/store/users/users.state';
import {Collection} from '../../../../core/store/collections/collection';
import {
  selectCollectionsByQuery,
  selectDocumentsByCustomQuery,
} from '../../../../core/store/common/permissions.selectors';
import {Query} from '../../../../core/store/navigation/query/query';
import {ConstraintData, DurationUnitsMap} from '../../../../core/model/data/constraint';
import {TranslationService} from '../../../../core/service/translation.service';
import {DEFAULT_SEARCH_ID, SearchConfig, SearchDocumentsConfig} from '../../../../core/store/searches/search';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {selectSearchConfig} from '../../../../core/store/searches/searches.state';
import {SearchesAction} from '../../../../core/store/searches/searches.action';
import {sortDocumentsByFavoriteAndLastUsed} from '../../../../core/store/documents/document.utils';
import {selectWorkspaceWithIds} from '../../../../core/store/common/common.selectors';
import {Project} from '../../../../core/store/projects/project';

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

  public readonly durationUnitsMap: DurationUnitsMap;

  private searchId = DEFAULT_SEARCH_ID;
  private config: SearchConfig;
  private page = 0;
  private documentsOrder = [];
  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>, private translationService: TranslationService) {
    this.durationUnitsMap = translationService.createDurationUnitsMap();
  }

  public ngOnInit() {
    this.constraintData$ = this.selectConstraintData$();
    this.users$ = this.store$.pipe(select(selectAllUsers));
    this.collections$ = this.store$.pipe(select(selectCollectionsByQuery));
    this.loaded$ = this.store$.pipe(select(selectCurrentQueryDocumentsLoaded));
    this.query$ = this.store$.pipe(select(selectQuery));
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.documentsConfig$ = this.selectDocumentsConfig$();
    this.currentUser$ = this.store$.pipe(select(selectCurrentUser));

    this.subscribeData();
  }

  private selectConstraintData$(): Observable<ConstraintData> {
    return this.store$.pipe(
      select(selectAllUsers),
      map(users => ({users, durationUnitsMap: this.durationUnitsMap}))
    );
  }

  private selectDocumentsConfig$(): Observable<SearchDocumentsConfig> {
    return this.store$.pipe(
      select(selectSearchConfig),
      tap(config => (this.config = config)),
      map(config => config && config.documents)
    );
  }

  public configChange(documentsConfig: SearchDocumentsConfig) {
    const config = {...this.config, documents: documentsConfig};
    this.store$.dispatch(new SearchesAction.SetConfig({searchId: this.searchId, config}));
  }

  public onFetchNextPage() {
    this.page++;
    this.store$
      .pipe(
        select(selectQuery),
        take(1)
      )
      .subscribe(query => {
        this.fetchDocuments(query);
      });
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private subscribeData() {
    const navigationSubscription = this.store$
      .pipe(
        select(selectQuery),
        filter(query => !!query),
        distinctUntilChanged()
      )
      .subscribe(query => {
        this.clearDocumentsInfo();
        this.fetchDocuments(query);
      });
    this.subscriptions.add(navigationSubscription);
  }

  private clearDocumentsInfo() {
    this.page = 0;
    this.documentsOrder = [];
  }

  private fetchDocuments(query: Query) {
    this.store$.dispatch(new DocumentsAction.Get({query: this.getPaginationQuery(query)}));
    this.subscribeDocuments(query);
  }

  private getPaginationQuery(query: Query): Query {
    return {...query, page: this.page, pageSize: PAGE_SIZE};
  }

  private subscribeDocuments(query: Query) {
    const pageSize = PAGE_SIZE * (this.page + 1);
    const customQuery = {...query, page: 0, pageSize};
    this.documents$ = this.store$.pipe(
      select(selectDocumentsByCustomQuery(customQuery, true)),
      map(documents => sortDocumentsByFavoriteAndLastUsed(documents)),
      map(documents => this.mapNewDocuments(documents))
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
}
