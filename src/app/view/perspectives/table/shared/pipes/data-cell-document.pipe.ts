/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {generateDocumentDataByQuery} from 'src/app/core/store/documents/document.utils';
import {selectQuery} from 'src/app/core/store/navigation/navigation.state';
import {selectCurrentUser} from 'src/app/core/store/users/users.state';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {TableConfigRow, TablePart} from '../../../../../core/store/tables/table.model';

@Pipe({
  name: 'dataCellDocument',
})
export class DataCellDocumentPipe implements PipeTransform {
  constructor(private store$: Store<{}>) {}

  public transform(documents: DocumentModel[], part: TablePart, row: TableConfigRow): Observable<DocumentModel> {
    return combineLatest(this.store$.pipe(select(selectQuery)), this.store$.pipe(select(selectCurrentUser))).pipe(
      map(([query, currentUser]) => {
        if (documents && documents[0]) {
          return documents[0];
        }

        return {
          collectionId: part.collectionId,
          correlationId: row.correlationId,
          data: part.index === 0 ? generateDocumentDataByQuery(query, currentUser) : {},
        };
      })
    );
  }
}
