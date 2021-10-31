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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {CdkDragDrop} from '@angular/cdk/drag-drop';
import {FormConfig, FormRow, FormRowLayoutType} from '../../../../../core/store/form/form-model';
import {generateCorrelationId} from '../../../../../shared/utils/resource.utils';
import {Collection} from '../../../../../core/store/collections/collection';
import {moveItemsInArray} from '../../../../../shared/utils/array.utils';

@Component({
  selector: 'form-editor',
  templateUrl: './form-editor.component.html',
  styleUrls: ['./form-editor.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FormEditorComponent {

  @Input()
  public config: FormConfig;

  @Input()
  public collection: Collection;

  @Output()
  public configChange = new EventEmitter<FormConfig>();

  public trackByRow(index: number, row: FormRow): string {
    return row.id;
  }

  public addRow(layout: FormRowLayoutType) {
    const newRows = [...(this.config?.rows || [])];
    const cells = layout.map((span, index) => ({id: `${generateCorrelationId()}${index}`, span}));
    newRows.push({id: generateCorrelationId(), cells});
    this.onRowsChange(newRows);
  }

  public onRowsChange(rows: FormRow[]) {
    const config = {...this.config, rows};
    this.configChange.emit(config);
  }

  public rowDropped(event: CdkDragDrop<FormRow, any>) {
    const newRows = [...(this.config?.rows || [])];
    moveItemsInArray(newRows, event.previousIndex, event.currentIndex);
    this.onRowsChange(newRows);
  }

  public onRowChange(row: FormRow, index: number) {
    const newRows = [...(this.config?.rows || [])];
    newRows[index] = row;
    this.onRowsChange(newRows);
  }

  public onRowDelete(index: number) {
    const newRows = [...(this.config?.rows || [])];
    newRows.splice(index, 1);
    this.onRowsChange(newRows);
  }
}
