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

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {DataInputConfiguration} from '../../../data-input/data-input-configuration';
import {TableColumn, TableColumnGroup, TableContextMenuItem} from '../../model/table-column';
import {TableRow} from '../../model/table-row';
import {DataValue} from '../../../../core/model/data-value';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {
  computeElementPositionInParent,
  isNotNullOrUndefined,
  isNullOrUndefinedOrEmpty,
  preventEvent,
} from '../../../utils/common.utils';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {BooleanConstraint} from '../../../../core/model/constraint/boolean.constraint';
import {EditedTableCell, SelectedTableCell, TableCellType} from '../../model/table-model';
import {BehaviorSubject} from 'rxjs';
import {DataInputSaveAction} from '../../../data-input/data-input-save-action';
import {isTableColumnDirectlyEditable} from '../../model/table-utils';
import {TableMenuComponent} from '../common/menu/table-menu.component';
import {isKeyPrintable, KeyCode} from '../../../key-code';
import {Direction} from '../../../direction';
import {DocumentHintsComponent} from '../../../document-hints/document-hints.component';
import {DocumentModel} from '../../../../core/store/documents/document.model';

@Component({
  selector: '[table-row]',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss', '../common/table-cell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRowComponent implements OnChanges {
  @Input()
  public columnGroups: TableColumnGroup[];

  @Input()
  public row: TableRow;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public selectedCell: SelectedTableCell;

  @Input()
  public editedCell: EditedTableCell;

  @Input()
  public detailColumnId: string;

  @Input()
  public cellType: TableCellType = TableCellType.Body;

  @Input()
  public linkedDocumentId: string;

  @Input()
  public collectionId: string;

  @Input()
  public linkTypeId: string;

  @Output()
  public onClick = new EventEmitter<string>();

  @Output()
  public onDetail = new EventEmitter();

  @Output()
  public onCancel = new EventEmitter<{columnId: string; action: DataInputSaveAction}>();

  @Output()
  public onDoubleClick = new EventEmitter<string>();

  @Output()
  public newValue = new EventEmitter<{columnId: string; value: any; action: DataInputSaveAction}>();

  @Output()
  public linkedDocumentSelect = new EventEmitter<DocumentModel>();

  @Output()
  public menuSelected = new EventEmitter<{row: TableRow; column: TableColumn; item: TableContextMenuItem}>();

  @ViewChild(TableMenuComponent)
  public tableMenuComponent: TableMenuComponent;

  @ViewChild(DocumentHintsComponent)
  public suggestions: DocumentHintsComponent;

  public readonly constraintType = ConstraintType;
  public readonly configuration: DataInputConfiguration = {
    common: {allowRichText: true},
    boolean: {center: true},
    user: {allowCenterOnlyIcon: true},
    action: {center: true},
  };

  public editedValue: DataValue;
  public suggestedColumn: TableColumn;

  public suggesting$ = new BehaviorSubject<DataValue>(null);

  constructor(public element: ElementRef) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.editedCell) {
      this.checkEdited();
    }
  }

  private checkEdited() {
    if (this.isEditing()) {
      const column = this.columnById(this.editedCell.columnId);
      if (column?.editable) {
        if (isTableColumnDirectlyEditable(column)) {
          this.onNewValue(column, {action: DataInputSaveAction.Direct, dataValue: this.computeDirectEditValue(column)});
          this.endSuggesting();
        } else {
          this.editedValue = this.createDataValue(column, this.editedCell.inputValue, true);
          if (column.collectionId) {
            this.suggestedColumn = column;
            this.suggesting$.next(this.editedValue);
          }
        }
      }
    } else {
      this.endSuggesting();
    }
  }

  private isEditing(): boolean {
    if (this.isBodyCell()) {
      return this.editedCell?.rowId === this.row?.id && this.editedCell?.tableId === this.row?.tableId;
    }
    return this.editedCell?.type === this.cellType && this.editedCell?.tableId === this.row?.tableId;
  }

  private createDataValue(column: TableColumn, value?: any, typed?: boolean): DataValue {
    const constraint = column.attribute?.constraint || new UnknownConstraint();
    if (typed) {
      return constraint.createInputDataValue(value, this.columnValue(column), this.constraintData);
    }
    const initialValue = isNotNullOrUndefined(value) ? value : this.columnValue(column);
    return constraint.createDataValue(initialValue, this.constraintData);
  }

  private columnById(columnId: string): TableColumn {
    return this.columnGroups.find(group => group.column?.id === columnId)?.column;
  }

  private computeDirectEditValue(column: TableColumn): DataValue {
    if (isTableColumnDirectlyEditable(column)) {
      const constraint = column.attribute?.constraint as BooleanConstraint;
      return constraint.createDataValue(!this.columnValue(column));
    }

    return null;
  }

  private columnValue(column: TableColumn): any {
    if (column?.attribute) {
      if (column?.collectionId) {
        return this.row.data?.[column.id];
      } else if (column?.linkTypeId) {
        return this.row.data?.[column.id];
      }
    }
    return null;
  }

  public onNewValue(column: TableColumn, data: {action?: DataInputSaveAction; dataValue: DataValue}) {
    this.editedValue = null;
    if (this.suggestions?.isSelected()) {
      this.suggestions.useSelection();
    } else if (!this.suggestions?.isSelectionConfirmed()) {
      this.saveData(column, data);
    }
    this.suggestions?.close();
  }

  private saveData(column: TableColumn, data: {action?: DataInputSaveAction; dataValue: DataValue}) {
    const value = data.dataValue.serialize();
    const currentValue = this.columnValue(column);
    if (
      this.isBodyCell() &&
      (currentValue === value || (isNullOrUndefinedOrEmpty(value) && isNullOrUndefinedOrEmpty(currentValue)))
    ) {
      this.onDataInputCancel(column, data.action);
    } else {
      this.newValue.emit({columnId: column.id, value, action: data.action});
    }
  }

  private isBodyCell(): boolean {
    return this.cellType === TableCellType.Body;
  }

  public onDataInputDblClick(column: TableColumn, event: MouseEvent) {
    if (column && !this.isEditingColumn(column)) {
      event.preventDefault();
      this.onDoubleClick.emit(column.id);
    }
  }

  private isEditingColumn(column: TableColumn): boolean {
    return this.isEditing() && this.editedCell?.columnId === column.id;
  }

  public onDataInputCancel(column: TableColumn, action?: DataInputSaveAction) {
    if (column) {
      this.onCancel.emit({columnId: column.id, action});
    }
  }

  public onDataInputClick(column: TableColumn, event: MouseEvent) {
    if (column && !this.isEditingColumn(column)) {
      this.onClick.emit(column.id);
    }
  }

  public trackByColumn(index: number, column: TableColumnGroup): string {
    return column.id;
  }

  public onRowEdit(columnId: string) {
    this.onDoubleClick.emit(columnId);
  }

  public onContextMenu(columnId: string, event: MouseEvent) {
    const columnIndex = this.columnGroups?.findIndex(group => group.column?.id === columnId);
    const column = this.columnGroups[columnIndex]?.column;
    if (column) {
      this.tableMenuComponent.id = columnId;
      this.tableMenuComponent.items = column.collectionId ? this.row.documentMenuItems : this.row.linkMenuItems;

      const {x, y} = computeElementPositionInParent(event, 'table');
      this.tableMenuComponent.open(x, y);
    }

    preventEvent(event);
  }

  public onMenuSelected(row: TableRow, columnId: string, item: TableContextMenuItem) {
    const column = this.columnGroups?.find(group => group.column?.id === columnId)?.column;
    if (column) {
      this.menuSelected.emit({row, column, item});
    }
  }

  public onDetailClick(event: MouseEvent) {
    preventEvent(event);
    this.onDetail.emit();
  }

  public onUseHint(data: {document: DocumentModel; external: boolean}) {
    this.endSuggesting(!data.external);
    this.linkedDocumentSelect.emit(data.document);
  }

  public onValueChange(dataValue: DataValue) {
    this.suggesting$.next(dataValue);
  }

  public onDataInputKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.ArrowDown:
        event.preventDefault();
        this.suggestions?.moveSelection(Direction.Down);
        return;
      case KeyCode.ArrowUp:
        event.preventDefault();
        this.suggestions?.moveSelection(Direction.Up);
        return;
    }

    if (isKeyPrintable(event) && this.suggestions) {
      return this.suggestions.clearSelection();
    }
  }

  public onEnterInvalid() {
    if (this.suggestions?.isSelected()) {
      this.suggestions.useSelection();
    }
  }

  private endSuggesting(cancel = false) {
    if (cancel) {
      this.onDataInputCancel(this.suggestedColumn);
    }
    this.suggesting$.next(null);
    this.suggestedColumn = null;
  }
}
