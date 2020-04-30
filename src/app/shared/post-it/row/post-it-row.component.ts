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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {DataRowComponent} from '../../data/data-row-component';
import {Attribute} from '../../../core/store/collections/collection';
import {DataRow} from '../../data/data-row.service';
import {DataCursor} from '../../data-input/data-cursor';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {ConstraintData, ConstraintType} from '../../../core/model/data/constraint';
import {BehaviorSubject} from 'rxjs';
import {isNotNullOrUndefined} from '../../utils/common.utils';
import {DataValue} from '../../../core/model/data-value';
import {UnknownConstraint} from '../../../core/model/constraint/unknown.constraint';
import {BooleanConstraint} from '../../../core/model/constraint/boolean.constraint';
import {DataInputConfiguration} from '../../data-input/data-input-configuration';
import {PostItLayoutType} from '../post-it-layout-type';

@Component({
  selector: 'post-it-row',
  templateUrl: './post-it-row.component.html',
  styleUrls: ['./post-it-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostItRowComponent implements DataRowComponent, OnChanges {
  @Input()
  public row: DataRow;

  @Input()
  public cursor: DataCursor;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public readonly: boolean;

  @Input()
  public unusedAttributes: Attribute[];

  @Input()
  public layoutType: PostItLayoutType;

  @Input()
  public editableKey = false;

  @Output()
  public newValue = new EventEmitter<any>();

  @Output()
  public newKey = new EventEmitter<string>();

  @Output()
  public deleteRow = new EventEmitter();

  @Output()
  public onFocus = new EventEmitter<number>();

  @Output()
  public onEdit = new EventEmitter<number>();

  @Output()
  public resetFocusAndEdit = new EventEmitter<number>();

  public readonly configuration: DataInputConfiguration = {common: {allowRichText: true}};

  public placeholder: string = 'kuk';

  public keyFocused$ = new BehaviorSubject(false);
  public keyEditing$ = new BehaviorSubject(false);
  public keyDataValue: DataValue;

  public editing$ = new BehaviorSubject(false);
  public valueFocused$ = new BehaviorSubject(false);
  public editedValue: DataValue;
  public dataValue: DataValue;

  public postItLayoutType = PostItLayoutType;

  public get constraintType(): ConstraintType {
    return this.row?.attribute?.constraint?.type;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.row && this.row) {
      this.keyDataValue = this.createKeyDataValue();
      this.dataValue = this.createDataValue();
    }
  }

  private createKeyDataValue(value?: any): DataValue {
    const initialValue = isNotNullOrUndefined(value)
      ? value
      : (this.row.attribute && this.row.attribute.name) || this.row.key;
    return new UnknownConstraint().createDataValue(initialValue);
  }

  private createDataValue(value?: any, typed?: boolean): DataValue {
    const constraint = this.row?.attribute?.constraint || new UnknownConstraint();
    if (typed) {
      return constraint.createInputDataValue(value, this.row.value, this.constraintData);
    }
    const initialValue = isNotNullOrUndefined(value) ? value : this.row.value;
    return constraint.createDataValue(initialValue, this.constraintData);
  }

  public onNewKey(dataValue: DataValue) {
    const value = dataValue.serialize();
    if (value !== this.getCurrentKey()) {
      this.newKey.emit(value);
    }
    this.onKeyInputCancel();
  }

  private getCurrentKey(): any {
    return (this.row.attribute && this.row.attribute.name) || this.row.key;
  }

  public onNewValue(dataValue: DataValue) {
    this.editedValue = null;
    const value = dataValue.serialize();
    if (value !== this.getCurrentValue()) {
      this.newValue.emit(value);
    }
    this.onDataInputCancel();
  }

  private getCurrentValue(): any {
    return this.row.value;
  }

  public onValueFocus() {
    if (!this.editing$.value) {
      this.onFocus.emit(1);
    }
  }

  public onKeyFocus() {
    if (!this.keyEditing$.value) {
      this.onFocus.emit(0);
    }
  }

  public onDataInputCancel() {
    this.dataValue = this.createDataValue();
    this.resetFocusAndEdit.emit(1);
  }

  public onKeyInputCancel() {
    this.keyDataValue = this.createKeyDataValue();
    this.resetFocusAndEdit.emit(0);
  }

  public onDataInputDblClick(event: MouseEvent) {
    if (!this.editing$.value) {
      event.preventDefault();
      this.onEdit.emit(1);
    }
  }

  public startColumnEditing(column: number, value?: any): boolean {
    if (column === 0) {
      this.endValueEditing();
      return this.startKeyEditing(value);
    } else if (column === 1) {
      this.endKeyEditing();
      return this.startValueEditing(value);
    }
    return false;
  }

  private startKeyEditing(value?: any): boolean {
    if (this.isManageable() && !this.keyEditing$.value) {
      this.keyDataValue = this.createKeyDataValue(value);
      this.keyEditing$.next(true);
      return true;
    }
    return false;
  }

  private startValueEditing(value?: any): boolean {
    this.editedValue = null;
    if (this.isEditable() && !this.editing$.value) {
      if (this.shouldDirectEditValue()) {
        this.onNewValue(this.computeDirectEditValue());
      } else {
        this.dataValue = this.createDataValue(value, true);
        this.editing$.next(true);
        return true;
      }
    }
    return false;
  }

  private shouldDirectEditValue(): boolean {
    return this.constraintType === ConstraintType.Boolean;
  }

  private computeDirectEditValue(): DataValue {
    if (this.constraintType === ConstraintType.Boolean) {
      const constraint = this.row.attribute.constraint as BooleanConstraint;
      return constraint.createDataValue(!this.row.value);
    }

    return null;
  }

  private isEditable(): boolean {
    return this.permissions && this.permissions.writeWithView && !this.readonly;
  }

  public onKeyInputDblClick(event: MouseEvent) {
    if (!this.keyEditing$.value) {
      event.preventDefault();
      this.onEdit.emit(0);
    }
  }

  public endColumnEditing(column: number) {
    if (column === 0) {
      this.endKeyEditing();
    } else if (column === 1) {
      this.endValueEditing();
    }
  }

  private endValueEditing() {
    if (this.editing$.value) {
      this.editing$.next(false);
    }
  }

  private endKeyEditing() {
    if (this.keyEditing$.value) {
      this.keyEditing$.next(false);
    }
  }

  private isManageable(): boolean {
    return this.permissions && this.permissions.manageWithView;
  }

  public focusColumn(column: number) {
    if (column === 0) {
      this.focusKey();
      this.valueFocused$.next(false);
    } else if (column === 1) {
      this.focusValue();
      this.keyFocused$.next(false);
    }
  }

  private focusKey() {
    if (this.keyEditing$.value || this.keyFocused$.value) {
      return;
    }
    this.keyFocused$.next(true);
  }

  private focusValue() {
    if (this.editing$.value || this.valueFocused$.value) {
      return;
    }
    this.valueFocused$.next(true);
  }

  public endRowEditing() {
    this.endKeyEditing();
    this.endValueEditing();
  }

  public unFocusRow() {
    this.keyFocused$.next(false);
    this.valueFocused$.next(false);
  }

  public onValueEdit(value: DataValue) {
    this.editedValue = value;
  }
}
