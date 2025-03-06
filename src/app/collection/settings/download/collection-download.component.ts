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
import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Workbook, Worksheet} from 'exceljs';

import {AppState} from '../../../core/store/app.state';
import {Collection} from '../../../core/store/collections/collection';
import {selectDocumentsByCollectionId} from '../../../core/store/documents/documents.state';

@Component({
  selector: 'collection-download',
  templateUrl: './collection-download.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionDownloadComponent {
  @Input()
  public collection: Collection;

  constructor(private store$: Store<AppState>) {}

  public onDownload() {
    const workbook: Workbook = new Workbook();
    const worksheet: Worksheet = workbook.addWorksheet(this.collection.name);

    this.collection.attributes.forEach((attribute, index) => {
      worksheet.getCell(1, index + 1).value = attribute.name;
    });

    this.store$.pipe(select(selectDocumentsByCollectionId(this.collection.id))).subscribe(documents => {
      documents.forEach((document, rowIndex) => {
        this.collection.attributes.forEach((attribute, columnIndex) => {
          worksheet.getCell(rowIndex + 2, columnIndex + 1).value = document.data[attribute.id];
        });
      });
    });

    workbook.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = this.collection.name + '.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}
