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
  HostBinding,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {DataCursor} from '../../../../data-input/data-cursor';
import {BehaviorSubject} from 'rxjs';
import {DataRow} from '../../../../data/data-row.service';
import {Attribute} from '../../../../../core/store/collections/collection';
import {DataRowComponent} from '../../../../data/data-row-component';
import {isNotNullOrUndefined} from '../../../../utils/common.utils';
import {DataResourceDataRowIconsComponent} from './icons/data-resource-data-row-icons.component';
import {DataInputConfiguration} from '../../../../data-input/data-input-configuration';
import {ConstraintData, ConstraintType, DataValue, UnknownConstraint} from '@lumeer/data-filters';

@Component({
  selector: 'data-resource-data-row',
  templateUrl: './data-resource-data-row.component.html',
  styleUrls: ['./data-resource-data-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataResourceDataRowComponent implements DataRowComponent, OnChanges {
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
  public preventEventBubble: boolean;

  @Input()
  public editableKey = false;

  @Output()
  public newValue = new EventEmitter<any>();

  @Output()
  public newKey = new EventEmitter<string>();

  @Output()
  public deleteRow = new EventEmitter();

  @Output()
  public attributeTypeClick = new EventEmitter();

  @Output()
  public attributeFunctionClick = new EventEmitter();

  @Output()
  public onFocus = new EventEmitter<number>();

  @Output()
  public onEdit = new EventEmitter<number>();

  @Output()
  public resetFocusAndEdit = new EventEmitter<number>();

  @ViewChild(DataResourceDataRowIconsComponent, {read: ElementRef})
  public iconsElement: ElementRef;

  @HostBinding('class.key-focused')
  public keyFocused: boolean;

  @HostBinding('class.value-focused')
  public valueFocused: boolean;

  public readonly configuration: DataInputConfiguration = {common: {allowRichText: true, delaySaveAction: true}};

  public placeholder: string;

  public keyEditing$ = new BehaviorSubject(false);
  public keyDataValue: DataValue;

  public editedValue: DataValue;
  public editing$ = new BehaviorSubject(false);
  public dataValue: DataValue;
  public editable: boolean;

  public get constraintType(): ConstraintType {
    return this.row?.attribute?.constraint?.type;
  }

  constructor() {
    this.placeholder = $localize`:@@dataResource.attribute.placeholder:Enter attribute name`;
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.row && this.row) {
      this.keyDataValue = this.createKeyDataValue();
      this.dataValue = this.createDataValue();
    }
    this.editable = this.isEditable();
  }

  private createKeyDataValue(value?: any): DataValue {
    const initialValue = isNotNullOrUndefined(value) ? value : this.row.attribute?.name || this.row.key;
    return new UnknownConstraint().createDataValue(initialValue);
  }

  private createDataValue(value?: any, typed?: boolean): DataValue {
    const constraint = (this.row.attribute && this.row.attribute.constraint) || new UnknownConstraint();
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
    return this.row.attribute?.name || this.row.key;
  }

  public onNewValue(dataValue: DataValue) {
    if (!this.isEditable()) {
      return;
    }

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
      this.dataValue = this.createDataValue(value, true);
      this.editing$.next(true);
      return true;
    }
    return false;
  }

  private isEditable(): boolean {
    return this.permissions?.writeWithView && !this.readonly;
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
      this.valueFocused = false;
    } else if (column === 1) {
      this.focusValue();
      this.keyFocused = false;
    }
  }

  private focusKey() {
    if (this.keyEditing$.value) {
      return;
    }
    this.keyFocused = true;
  }

  private focusValue() {
    if (this.editing$.value) {
      return;
    }
    this.valueFocused = true;
  }

  public endRowEditing() {
    this.endKeyEditing();
    this.endValueEditing();
  }

  public unFocusRow() {
    this.keyFocused = false;
    this.valueFocused = false;
  }

  public onValueEdit(value: DataValue) {
    this.editedValue = value;
  }
}
