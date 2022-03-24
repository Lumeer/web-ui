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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';
import {Collection, CollectionPurposeType} from '../../../core/store/collections/collection';
import {BehaviorSubject, combineLatest, Observable, of, Subject} from 'rxjs';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {
  checkTasksCollectionsQuery,
  getBaseCollectionIdsFromQuery,
  getQueryFiltersForCollection,
} from '../../../core/store/navigation/query/query.util';
import {generateDocumentData} from '../../../core/store/documents/document.utils';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectContributeCollectionsByView} from '../../../core/store/common/permissions.selectors';
import {map, switchMap, take, takeUntil, tap} from 'rxjs/operators';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';
import {View} from '../../../core/store/views/view';
import {
  selectDefaultDocumentView,
  selectDefaultDocumentViews,
  selectViewById,
  selectViewQuery,
} from '../../../core/store/views/views.state';
import {Query} from '../../../core/store/navigation/query/query';
import {selectCollectionById, selectCollectionsByIds} from '../../../core/store/collections/collections.state';
import {uniqueValues} from '../../utils/array.utils';
import {mergeCollections} from '../../../core/store/collections/collection.util';

@Component({
  selector: 'create-document-modal',
  templateUrl: './create-document-modal.component.html',
  styleUrls: ['./create-document-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateDocumentModalComponent implements OnInit {
  @Input()
  public purpose: CollectionPurposeType;

  @Input()
  public viewId: string;

  public documentCreated$ = new Subject();
  public collectionId$ = new BehaviorSubject(null);
  public collections$: Observable<Collection[]>;
  public document$: Observable<DocumentModel>;
  public view$: Observable<View>;
  public query$: Observable<Query>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    if (this.viewId) {
      this.view$ = this.store$.pipe(select(selectViewById(this.viewId)));

      this.collections$ = this.view$.pipe(
        switchMap(view => this.selectContributeTasksCollections(view)),
        tap(collections => this.checkSelectedCollection(collections))
      );
    } else {
      const collection$ = this.collectionId$.pipe(
        switchMap(collectionId => this.store$.pipe(select(selectCollectionById(collectionId))))
      );
      this.view$ = collection$.pipe(
        switchMap(collection => this.store$.pipe(select(selectDefaultDocumentView(collection?.purpose))))
      );

      this.collections$ = this.store$.pipe(
        select(selectDefaultDocumentViews(CollectionPurposeType.Tasks)),
        map(views => views.reduce((ids, view) => [...ids, ...getBaseCollectionIdsFromQuery(view.query)], [])),
        map(collectionIds => uniqueValues(collectionIds)),
        switchMap(collectionIds =>
          combineLatest([
            this.selectContributeTasksCollections(),
            this.store$.pipe(select(selectCollectionsByIds(collectionIds))),
          ])
        ),
        map(([c1, c2]) => mergeCollections(c1, c2)),
        tap(collections => this.checkSelectedCollection(collections))
      );
    }
    this.query$ = this.view$.pipe(
      switchMap(view => {
        if (view) {
          return of(view.query);
        }
        return this.store$.pipe(select(selectViewQuery));
      })
    );
  }

  private selectContributeTasksCollections(view?: View): Observable<Collection[]> {
    return this.store$.pipe(
      select(selectContributeCollectionsByView(view)),
      map(collections => (this.purpose ? collections.filter(coll => coll.purpose?.type === this.purpose) : collections))
    );
  }

  private checkSelectedCollection(collections: Collection[]) {
    const selectedId = this.collectionId$.value;
    const selected = selectedId && collections.find(coll => coll.id === selectedId);
    if (!selected && collections?.length) {
      this.onSelect(collections[0].id);
    }
  }

  public onSelect(collectionId: string) {
    this.collectionId$.next(collectionId);

    this.document$ = combineLatest([
      this.query$,
      this.store$.pipe(select(selectConstraintData)),
      this.collections$,
    ]).pipe(
      take(1),
      map(([query, constraintData, collections]) => {
        const tasksQuery = checkTasksCollectionsQuery(collections, query, {});
        const collection = collections?.find(coll => coll.id === collectionId);
        const queryFilters = getQueryFiltersForCollection(tasksQuery, collectionId);
        const data = generateDocumentData(collection, queryFilters, constraintData, true);
        return {data, collectionId};
      }),
      takeUntil(this.documentCreated$)
    );
  }
}
