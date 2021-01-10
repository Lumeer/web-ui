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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {EditedTableCell, SelectedTableCell, TableCellType} from '../model/table-model';
import {TableColumn, TableColumnGroup, TableContextMenuItem} from '../model/table-column';
import {ConstraintData} from '../../../core/model/data/constraint';
import {DataInputSaveAction} from '../../data-input/data-input-save-action';
import {TableNewRow, TableRow} from '../model/table-row';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {CdkScrollable, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {DataValue} from '../../../core/model/data-value';

@Component({
  selector: 'table-new-row',
  templateUrl: './table-new-row.component.html',
  styleUrls: ['./table-new-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableNewRowComponent {
  @Input()
  public newRow: TableNewRow;

  @Input()
  public columnGroups: TableColumnGroup[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public selectedCell: SelectedTableCell;

  @Input()
  public editedCell: EditedTableCell;

  @Input()
  public scrollId: string;

  @Input()
  public collectionId: string;

  @Input()
  public linkTypeId: string;

  @Input()
  public scrollOffset: number;

  @Output()
  public onNewRowClick = new EventEmitter();

  @Output()
  public onClick = new EventEmitter<string>();

  @Output()
  public onDoubleClick = new EventEmitter<string>();

  @Output()
  public onCancel = new EventEmitter<string>();

  @Output()
  public newValue = new EventEmitter<{columnId: string; value: DataValue; action: DataInputSaveAction}>();

  @Output()
  public linkedDocumentSelect = new EventEmitter<DocumentModel>();

  @Output()
  public menuSelected = new EventEmitter<{row: TableRow; column: TableColumn; item: TableContextMenuItem}>();

  @ViewChild(CdkScrollable, {static: false})
  set content(content: CdkScrollable) {
    if (this.scrollOffset && content) {
      content.scrollTo({left: this.scrollOffset});
    }
  }

  public readonly cellType = TableCellType.NewRow;
}
