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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter, ViewChild} from '@angular/core';
import {DataInputConfiguration} from '../../../data-input/data-input-configuration';
import {TableColumn} from '../../model/table-column';
import {TableRow} from '../../model/table-row';
import {DataRowComponent} from '../../../data/data-row-component';
import {BehaviorSubject} from 'rxjs';
import {DataValue} from '../../../../core/model/data-value';
import {DocumentHintsComponent} from '../../../document-hints/document-hints.component';
import {isKeyPrintable, KeyCode} from '../../../key-code';
import {Direction} from '../../../direction';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {isNotNullOrUndefined} from '../../../utils/common.utils';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {BooleanConstraint} from '../../../../core/model/constraint/boolean.constraint';

@Component({
  selector: '[table-row]',
  templateUrl: './table-row.component.html',
  styleUrls: ['./table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TableRowComponent implements DataRowComponent {
  @Input()
  public columns: TableColumn[];

  @Input()
  public row: TableRow;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public onFocus = new EventEmitter<number>();

  @Output()
  public onEdit = new EventEmitter<number>();

  @Output()
  public resetFocusAndEdit = new EventEmitter<number>();

  @Output()
  public newValue = new EventEmitter<{column: number; value: any}>();

  @ViewChild(DocumentHintsComponent)
  public suggestions: DocumentHintsComponent;

  public readonly constraintType = ConstraintType;
  public readonly configuration: DataInputConfiguration = {
    common: {allowRichText: true},
    boolean: {center: true},
    user: {allowCenterOnlyIcon: true},
  };

  public columnEditing$ = new BehaviorSubject<number>(null);
  public columnFocused$ = new BehaviorSubject<number>(null);
  public suggesting$ = new BehaviorSubject<DataValue>(null);

  public editedValue: DataValue;

  public endColumnEditing(column: number) {
    if (this.columnEditing$.value === column) {
      this.endRowEditing();
    }
  }

  public endRowEditing() {
    this.suggesting$.next(null);
    this.columnEditing$.next(null);
  }

  public focusColumn(column: number) {
    this.columnFocused$.next(column);
  }

  public startColumnEditing(column: number, value?: any): boolean {
    this.editedValue = null;
    if (this.isColumnEditable(column)) {
      if (this.shouldDirectEditValue(column)) {
        this.onNewValue(column, this.computeDirectEditValue(column));
      } else {
        this.editedValue = this.createDataValue(column, value, true);
        this.suggesting$.next(this.editedValue);
        this.columnEditing$.next(column);
        return true;
      }
    }
    return false;
  }

  private createDataValue(column: number, value?: any, typed?: boolean): DataValue {
    const attribute = this.columns[column].attribute;
    const constraint = (attribute && attribute.constraint) || new UnknownConstraint();
    if (typed) {
      return constraint.createInputDataValue(value, this.columnValue(column), this.constraintData);
    }
    const initialValue = isNotNullOrUndefined(value) ? value : this.columnValue(column);
    return constraint.createDataValue(initialValue, this.constraintData);
  }

  private shouldDirectEditValue(column: number): boolean {
    return this.columnConstraintType(column) === ConstraintType.Boolean;
  }

  private columnConstraintType(column: number): ConstraintType {
    const attribute = this.columns[column].attribute;
    return attribute && attribute.constraint && attribute.constraint.type;
  }

  private isColumnEditable(column: number): boolean {
    return this.columns[column].editable;
  }

  private computeDirectEditValue(column: number): DataValue {
    if (this.columnConstraintType(column) === ConstraintType.Boolean) {
      const constraint = this.columns[column].attribute.constraint as BooleanConstraint;
      return constraint.createDataValue(!this.columnValue(column));
    }

    return null;
  }

  private columnValue(index: number): any {
    const column = this.columns[index];
    if (column?.collectionId) {
      return this.row.documentData?.[column.attribute.id];
    } else if (column?.linkTypeId) {
      return this.row.linkInstanceData?.[column.attribute.id];
    }
    return null;
  }

  public unFocusRow() {
    this.columnFocused$.next(null);
  }

  public onNewValue(column: number, dataValue: DataValue) {
    this.editedValue = null;
    if (this.suggestions && this.suggestions.isSelected()) {
      this.suggestions.useSelection();
    } else {
      this.saveData(column, dataValue);
    }
    this.onDataInputCancel(column);
  }

  private saveData(column: number, dataValue: DataValue) {
    const value = dataValue.serialize();
    const currentValue = this.columnValue(column);
    if (currentValue !== value) {
      this.newValue.emit({column, value});
    }
  }

  public onDataInputDblClick(column: number, event: MouseEvent) {
    if (this.columnEditing$.value !== column) {
      event.preventDefault();
      this.onEdit.emit(column);
    }
  }

  public onDataInputCancel(column: number) {
    this.resetFocusAndEdit.emit(column);
  }

  public onDataInputFocus(column: number, event: MouseEvent) {
    if (this.columnEditing$.value !== column) {
      this.onFocus.emit(column);
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
    this.endRowEditing();
  }

  public onEnterInvalid() {
    if (this.suggestions && this.suggestions.isSelected()) {
      this.suggestions.useSelection();
      this.endRowEditing();
    }
  }

  public trackByColumn(index: number, column: TableColumn): string {
    return `${column.collectionId || column.linkTypeId}:${column.attribute.id}`;
  }
}
