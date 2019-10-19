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

import {ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output} from '@angular/core';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DataCursor} from '../../../../data-input/data-cursor';
import {ConstraintData, ConstraintType} from '../../../../../core/model/data/constraint';
import {BehaviorSubject} from 'rxjs';
import {DataRow} from '../../../../data/data-row.service';
import {Attribute} from '../../../../../core/store/collections/collection';
import {DataRowComponent} from '../../../../data/data-row-component';

@Component({
  selector: 'document-data-row',
  templateUrl: './document-data-row.component.html',
  styleUrls: ['./document-data-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDataRowComponent implements DataRowComponent {
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

  @HostBinding('class.key-focused')
  public keyFocused: boolean;

  @HostBinding('class.value-focused')
  public valueFocused: boolean;

  public readonly booleanConstraintType = ConstraintType.Boolean;

  public placeholder: string;

  public keyEditing$ = new BehaviorSubject(false);
  public initialKey: any;
  public editing$ = new BehaviorSubject(false);
  public initialValue: any;

  public get constraintType(): ConstraintType {
    return this.row && this.row.attribute && this.row.attribute.constraint && this.row.attribute.constraint.type;
  }

  constructor(private i18n: I18n) {
    this.placeholder = i18n({id: 'dataResource.attribute.placeholder', value: 'Enter attribute name'});
  }

  public onNewKey(value: string) {
    this.initialKey = null;
    this.newKey.emit(value);
    this.onKeyInputCancel();
  }

  public onNewValue(value: any) {
    this.initialValue = null;
    this.newValue.emit(value);
    this.onDataInputCancel();
  }

  public onValueFocus() {
    this.onFocus.emit(1);
  }

  public onKeyFocus() {
    this.onFocus.emit(0);
  }

  public onDataInputCancel() {
    this.resetFocusAndEdit.emit(1);
  }

  public onKeyInputCancel() {
    this.resetFocusAndEdit.emit(0);
  }

  public onDataInputDblClick(event: MouseEvent) {
    event.preventDefault();
    this.onEdit.emit(1);
  }

  public startValueEditing(value?: any) {
    if (this.isEditable() && !this.editing$.value) {
      if (this.shouldDirectEditValue()) {
        this.onNewValue(this.computeDirectEditValue());
      } else {
        this.initialValue = value;
        this.editing$.next(true);
      }
    }
  }

  private shouldDirectEditValue(): boolean {
    return this.constraintType === ConstraintType.Boolean;
  }

  private computeDirectEditValue(): any {
    if (this.constraintType === ConstraintType.Boolean) {
      return !this.row.value;
    }

    return null;
  }

  private isEditable(): boolean {
    return this.permissions && this.permissions.writeWithView && !this.readonly;
  }

  public onKeyInputDblClick(event: MouseEvent) {
    event.preventDefault();
    this.onEdit.emit(0);
  }

  public startKeyEditing(value?: any) {
    if (this.isManageable() && !this.keyEditing$.value) {
      this.initialKey = value;
      this.keyEditing$.next(true);
    }
  }

  public endValueEditing() {
    this.initialValue = null;
    if (this.editing$.value) {
      this.editing$.next(false);
    }
  }

  public endKeyEditing() {
    this.initialKey = null;
    if (this.keyEditing$.value) {
      this.keyEditing$.next(false);
    }
  }

  private isManageable(): boolean {
    return this.permissions && this.permissions.manageWithView;
  }

  public focusKey(focus: boolean) {
    if (focus && this.keyEditing$.value) {
      return;
    }
    this.keyFocused = focus;
  }

  public focusValue(focus: boolean) {
    if (focus && this.editing$.value) {
      return;
    }
    this.valueFocused = focus;
  }
}
