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
  ViewChild,
  OnChanges,
  SimpleChanges,
  ElementRef,
} from '@angular/core';
import {DataInputConfiguration} from '../../../data-input/data-input-configuration';
import {TableColumn} from '../../model/table-column';
import {TableRow} from '../../model/table-row';
import {DataValue} from '../../../../core/model/data-value';
import {DocumentHintsComponent} from '../../../document-hints/document-hints.component';
import {isKeyPrintable, KeyCode} from '../../../key-code';
import {Direction} from '../../../direction';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {isNotNullOrUndefined} from '../../../utils/common.utils';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {BooleanConstraint} from '../../../../core/model/constraint/boolean.constraint';
import {EditedTableCell, SelectedTableCell, TABLE_ROW_HEIGHT, TableCellType} from '../../model/table-model';
import {BehaviorSubject} from 'rxjs';

@Component({
  selector: '[table-row]',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss', '../common/table-cell.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRowComponent implements OnChanges {
  @Input()
  public columns: TableColumn[];

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
  public onCancel = new EventEmitter<string>();

  @Output()
  public onDoubleClick = new EventEmitter<string>();

  @Output()
  public newValue = new EventEmitter<{columnId: string; value: any}>();

  @ViewChild(DocumentHintsComponent)
  public suggestions: DocumentHintsComponent;

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

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.editedCell || changes.row) {
      this.checkEdited();
    }
  }

  private checkEdited() {
    if (this.editedCell?.rowId === this.row?.id) {
      const column = this.columnById(this.editedCell.columnId);
      if (column?.editable) {
        if (this.shouldDirectEditValue(column)) {
          this.onNewValue(column, this.computeDirectEditValue(column));
        } else {
          this.editedValue = this.createDataValue(column, this.editedCell.inputValue, true);
          this.suggesting$.next(this.editedValue);
        }
      }
    }
  }

  private createDataValue(column: TableColumn, value?: any, typed?: boolean): DataValue {
    const constraint = column.attribute?.constraint || new UnknownConstraint();
    if (typed) {
      return constraint.createInputDataValue(value, this.columnValue(column), this.constraintData);
    }
    const initialValue = isNotNullOrUndefined(value) ? value : this.columnValue(column);
    return constraint.createDataValue(initialValue, this.constraintData);
  }

  private shouldDirectEditValue(column: TableColumn): boolean {
    return this.columnConstraintType(column) === ConstraintType.Boolean;
  }

  private columnConstraintType(column: TableColumn): ConstraintType {
    return column.attribute?.constraint?.type || ConstraintType.Unknown;
  }

  private columnById(columnId: string): TableColumn {
    return this.columns.find(column => column.id === columnId);
  }

  private computeDirectEditValue(column: TableColumn): DataValue {
    if (this.columnConstraintType(column) === ConstraintType.Boolean) {
      const constraint = column.attribute.constraint as BooleanConstraint;
      return constraint.createDataValue(!this.columnValue(column));
    }

    return null;
  }

  private columnValue(column: TableColumn): any {
    if (column?.collectionId) {
      return this.row.documentData?.[column.attribute.id];
    } else if (column?.linkTypeId) {
      return this.row.linkInstanceData?.[column.attribute.id];
    }
    return null;
  }

  public onNewValue(column: TableColumn, dataValue: DataValue) {
    this.editedValue = null;
    if (this.suggestions?.isSelected()) {
      this.suggestions.useSelection();
    } else {
      this.saveData(column, dataValue);
    }
    this.onDataInputCancel(column);
  }

  private saveData(column: TableColumn, dataValue: DataValue) {
    const value = dataValue.serialize();
    const currentValue = this.columnValue(column);
    if (currentValue !== value) {
      this.newValue.emit({columnId: column.id, value});
    }
  }

  public onDataInputDblClick(columnId: string, event: MouseEvent) {
    if (this.editedCell?.columnId !== columnId) {
      event.preventDefault();
      this.onDoubleClick.emit(columnId);
    }
  }

  public onDataInputCancel(column: TableColumn) {
    this.onCancel.emit(column.id);
  }

  public onDataInputClick(columnId: string, event: MouseEvent) {
    if (this.editedCell?.columnId !== columnId) {
      this.onClick.emit(columnId);
    }
  }

  public onDataInputKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.ArrowDown:
        event.preventDefault();
        this.suggestions?.moveSelection(Direction.Down);
        break;
      case KeyCode.ArrowUp:
        event.preventDefault();
        this.suggestions?.moveSelection(Direction.Up);
        break;
    }

    if (isKeyPrintable(event) && this.suggestions) {
      this.suggestions?.clearSelection();
    }
  }

  public onUseHint() {
    // TODO this.endRowEditing();
  }

  public onEnterInvalid() {
    if (this.suggestions?.isSelected()) {
      this.suggestions.useSelection();
      // TODO this.endRowEditing();
    }
  }

  public trackByColumn(index: number, column: TableColumn): string {
    return column.id;
  }
}
