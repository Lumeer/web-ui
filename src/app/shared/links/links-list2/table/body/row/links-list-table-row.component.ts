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
import {LinkColumn} from '../../../model/link-column';
import {ConstraintData, ConstraintType} from '../../../../../../core/model/data/constraint';
import {LinkRow} from '../../../model/link-row';
import {DataRowComponent} from '../../../../../data/data-row-component';
import {BehaviorSubject} from 'rxjs';
import {isNumeric, toNumber} from '../../../../../utils/common.utils';

@Component({
  selector: '[links-list-table-row]',
  templateUrl: './links-list-table-row.component.html',
  styleUrls: ['./links-list-table-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinksListTableRowComponent implements DataRowComponent {
  @Input()
  public columns: LinkColumn[];

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public row: LinkRow;

  @Input()
  public readonly: boolean;

  @Output()
  public onFocus = new EventEmitter<number>();

  @Output()
  public onEdit = new EventEmitter<number>();

  @Output()
  public resetFocusAndEdit = new EventEmitter<number>();

  @Output()
  public newValue = new EventEmitter<{column: number; value: any}>();

  public readonly booleanConstraintType = ConstraintType.Boolean;

  public columnEditing$ = new BehaviorSubject<number>(null);
  public columnFocused$ = new BehaviorSubject<number>(null);

  public initialValue: any;

  public endColumnEditing(column: number) {
    if (this.columnEditing$.value === column) {
      this.endRowEditing();
    }
  }

  public endRowEditing() {
    this.initialValue = null;
    this.columnEditing$.next(null);
  }

  public focusColumn(column: number) {
    this.columnFocused$.next(column);
  }

  public startColumnEditing(column: number, value?: any): boolean {
    if (this.shouldDirectEditValue(column)) {
      this.onNewValue(column, this.computeDirectEditValue(column));
    } else {
      this.initialValue = this.modifyInitialValue(column, value);
      this.columnEditing$.next(column);
      return true;
    }
    return false;
  }

  private shouldDirectEditValue(column: number): boolean {
    return this.columnConstraintType(column) === ConstraintType.Boolean;
  }

  private columnConstraintType(column: number): ConstraintType {
    const attribute = this.columns[column].attribute;
    return attribute && attribute.constraint && attribute.constraint.type;
  }

  private computeDirectEditValue(column: number): any {
    if (this.columnConstraintType(column) === ConstraintType.Boolean) {
      return !this.columnValue(column);
    }

    return null;
  }

  private modifyInitialValue(index: number, value: any): any {
    switch (this.columnConstraintType(index)) {
      case ConstraintType.Percentage:
        return isNumeric(value) ? toNumber(value) / 100 : value;
      default:
        return value;
    }
  }

  private columnValue(index: number): any {
    const column = this.columns[index];
    if (column && column.collectionId) {
      return ((this.row.linkInstance && this.row.document.data) || {})[column.attribute.id];
    } else if (column && column.linkTypeId) {
      return ((this.row.linkInstance && this.row.linkInstance.data) || {})[column.attribute.id];
    }
    return null;
  }

  public unFocusRow() {
    this.columnFocused$.next(null);
  }

  public onNewValue(column: number, value: any) {
    const currentValue = this.columnValue(column);
    if (currentValue !== value) {
      this.newValue.emit({column, value});
    }
    this.onDataInputCancel(column);
  }

  public onDataInputDblClick(column: number, event: MouseEvent) {
    event.preventDefault();
    this.onEdit.emit(column);
  }

  public onDataInputCancel(column: number) {
    this.resetFocusAndEdit.emit(column);
  }

  public onDataInputFocus(column: number) {
    this.onFocus.emit(column);
  }

  public trackByColumn(index: number, column: LinkColumn): string {
    return `${column.collectionId || column.linkTypeId}:${column.attribute.id}`;
  }
}
