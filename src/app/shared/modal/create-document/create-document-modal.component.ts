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
import {Collection} from '../../../core/store/collections/collection';
import {BehaviorSubject} from 'rxjs';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {Query} from '../../../core/store/navigation/query/query';
import {getQueryFiltersForCollection} from '../../../core/store/navigation/query/query.util';
import {generateDocumentData} from '../../../core/store/documents/document.utils';
import {isNotNullOrUndefined} from '../../utils/common.utils';
import {ConstraintData} from '../../../core/model/data/constraint';

@Component({
  selector: 'create-document-modal',
  templateUrl: './create-document-modal.component.html',
  styleUrls: ['./create-document-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateDocumentModalComponent implements OnInit {
  @Input()
  public collections: Collection[];

  @Input()
  public query: Query;

  @Input()
  public constraintData: ConstraintData;

  public collection$ = new BehaviorSubject<Collection>(null);
  public document$ = new BehaviorSubject<DocumentModel>(null);

  public selectedId$ = new BehaviorSubject(null);

  public ngOnInit() {
    if (this.collections.length) {
      this.onSelect(this.collections[0].id);
    }
  }

  public onSelect(collectionId: string) {
    this.selectedId$.next(collectionId);
    const collection = this.collections.find(coll => coll.id === collectionId);
    this.collection$.next(collection);

    const queryFilters = getQueryFiltersForCollection(this.query, collectionId);
    const queryData = generateDocumentData(collection, queryFilters, this.constraintData);
    const data = ((collection && collection.attributes) || []).reduce(
      (map, attr) => ({
        ...map,
        [attr.id]: isNotNullOrUndefined(queryData[attr.id]) ? queryData[attr.id] : '',
      }),
      queryData
    );

    this.document$.next({data, collectionId});
  }
}
