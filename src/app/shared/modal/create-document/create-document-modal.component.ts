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

import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {Collection, CollectionPurposeType} from '../../../core/store/collections/collection';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {getQueryFiltersForCollection} from '../../../core/store/navigation/query/query.util';
import {generateDocumentData} from '../../../core/store/documents/document.utils';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectContributeCollections, selectTasksQuery} from '../../../core/store/common/permissions.selectors';
import {map, take, tap} from 'rxjs/operators';
import {selectConstraintData} from '../../../core/store/constraint-data/constraint-data.state';

@Component({
  selector: 'create-document-modal',
  templateUrl: './create-document-modal.component.html',
  styleUrls: ['./create-document-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateDocumentModalComponent implements OnInit {
  @Input()
  public purpose: CollectionPurposeType;

  public collectionId$ = new BehaviorSubject(null);
  public collections$: Observable<Collection[]>;
  public document$: Observable<DocumentModel>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.collections$ = this.store$.pipe(
      select(selectContributeCollections),
      map(collections =>
        this.purpose ? collections.filter(coll => coll.purpose?.type === this.purpose) : collections
      ),
      tap(collections => this.checkSelectedCollection(collections))
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
      this.store$.pipe(select(selectTasksQuery)),
      this.store$.pipe(select(selectConstraintData)),
      this.collections$,
    ]).pipe(
      take(1),
      map(([query, constraintData, collections]) => {
        const collection = collections?.find(coll => coll.id === collectionId);
        const queryFilters = getQueryFiltersForCollection(query, collectionId);
        const data = generateDocumentData(collection, queryFilters, constraintData, true);
        return {data, collectionId};
      })
    );
  }
}
