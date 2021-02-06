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

import {Pipe, PipeTransform} from '@angular/core';
import {generateDocumentDataByQuery} from '../../../../../core/store/documents/document.utils';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {TableConfigPart, TableConfigRow} from '../../../../../core/store/tables/table.model';
import {Query} from '../../../../../core/store/navigation/query/query';
import {Collection} from '../../../../../core/store/collections/collection';
import {ConstraintData} from '@lumeer/data-filters';

@Pipe({
  name: 'dataCellDocument',
})
export class DataCellDocumentPipe implements PipeTransform {
  public transform(
    documents: DocumentModel[],
    part: TableConfigPart,
    partIndex: number,
    row: TableConfigRow,
    query: Query,
    collections: Collection[],
    constraintData: ConstraintData
  ): DocumentModel {
    if (documents && documents[0]) {
      return documents[0];
    }

    if (!part.collectionId) {
      return null;
    }

    return {
      collectionId: part.collectionId,
      correlationId: row.correlationId,
      data: partIndex === 0 ? generateDocumentDataByQuery(query, collections, constraintData, false) : {},
    };
  }
}
