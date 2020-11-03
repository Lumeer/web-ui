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
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ViewChildren,
  QueryList,
} from '@angular/core';
import {DataInputConfiguration} from '../../../data-input/data-input-configuration';
import {columnConstraintType, TableColumn, TableColumnGroup, TableContextMenuItem} from '../../model/table-column';
import {TableRow} from '../../model/table-row';
import {DataValue} from '../../../../core/model/data-value';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {isNotNullOrUndefined, isNullOrUndefinedOrEmpty, preventEvent} from '../../../utils/common.utils';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {BooleanConstraint} from '../../../../core/model/constraint/boolean.constraint';
import {EditedTableCell, SelectedTableCell, TABLE_ROW_HEIGHT, TableCellType} from '../../model/table-model';
import {BehaviorSubject} from 'rxjs';
import {DataInputSaveAction} from '../../../data-input/data-input-save-action';
import {isTableColumnDirectlyEditable} from '../../model/table-utils';
import {ContextMenuService} from 'ngx-contextmenu';
import {TableMenuComponent} from '../common/menu/table-menu.component';

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
  public menuSelected = new EventEmitter<{row: TableRow; column: TableColumn; item: TableContextMenuItem}>();

  @ViewChildren(TableMenuComponent)
  public tableMenuComponents: QueryList<TableMenuComponent>;

  public readonly tableRowHeight = TABLE_ROW_HEIGHT;
  public readonly cellType = TableCellType.Body;
  public readonly constraintType = ConstraintType;
  public readonly configuration: DataInputConfiguration = {
    common: {allowRichText: true},
    boolean: {center: true},
    user: {allowCenterOnlyIcon: true},
  };

  public editedValue: DataValue;

  public suggesting$ = new BehaviorSubject<DataValue>(null);

  constructor(private contextMenuService: ContextMenuService) {}

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
        } else {
          this.editedValue = this.createDataValue(column, this.editedCell.inputValue, true);
          this.suggesting$.next(this.editedValue);
        }
      }
    }
  }

  private isEditing(): boolean {
    return this.editedCell?.rowId === this.row?.id && this.editedCell?.tableId === this.row?.tableId;
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
    if (columnConstraintType(column) === ConstraintType.Boolean) {
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
    this.saveData(column, data);
  }

  private saveData(column: TableColumn, data: {action?: DataInputSaveAction; dataValue: DataValue}) {
    const value = data.dataValue.serialize();
    const currentValue = this.columnValue(column);
    if (currentValue === value || (isNullOrUndefinedOrEmpty(value) && isNullOrUndefinedOrEmpty(currentValue))) {
      this.onDataInputCancel(column, data.action);
    } else {
      this.newValue.emit({columnId: column.id, value, action: data.action});
    }
  }

  public onDataInputDblClick(column: TableColumn, event: MouseEvent) {
    if (column && this.editedCell?.columnId !== column.id) {
      event.preventDefault();
      this.onDoubleClick.emit(column.id);
    }
  }

  public onDataInputCancel(column: TableColumn, action?: DataInputSaveAction) {
    this.onCancel.emit({columnId: column.id, action});
  }

  public onDataInputClick(column: TableColumn, event: MouseEvent) {
    if (column && (this.editedCell?.columnId !== column.id || this.editedCell?.rowId !== this.row.id)) {
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
    const menuElement = columnId && this.tableMenuComponents.find(component => component.id === columnId);
    if (menuElement) {
      this.contextMenuService.show.next({
        contextMenu: menuElement.contextMenu,
        event,
        item: null,
      });
    }

    preventEvent(event);
  }

  public onMenuSelected(row: TableRow, column: TableColumn, item: TableContextMenuItem) {
    this.menuSelected.emit({row, column, item});
  }

  public onDetailClick(event: MouseEvent) {
    preventEvent(event);
    this.onDetail.emit();
  }
}
