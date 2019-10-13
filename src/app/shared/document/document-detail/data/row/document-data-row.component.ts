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
  Output,
  ViewChild
} from '@angular/core';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DataCursor} from '../../../../data-input/data-cursor';
import {ConstraintData, ConstraintType} from '../../../../../core/model/data/constraint';
import {BehaviorSubject} from 'rxjs';
import {DataRow} from '../../../../data/data-row.service';

@Component({
  selector: 'document-data-row',
  templateUrl: './document-data-row.component.html',
  styleUrls: ['./document-data-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDataRowComponent {
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
  public inputKeyDown = new EventEmitter<KeyboardEvent>();

  @Output()
  public onFocus = new EventEmitter<number>();

  @Output()
  public resetFocus = new EventEmitter();

  @ViewChild('keyInput', {static: false})
  public keyInput: ElementRef<HTMLInputElement>;

  @HostBinding('class.key-focused')
  public keyFocused: boolean;

  @HostBinding('class.value-focused')
  public valueFocused: boolean;

  public readonly booleanConstraintType = ConstraintType.Boolean;

  public placeholder: string;

  public keyEditing$ = new BehaviorSubject(false);
  public editing$ = new BehaviorSubject(false);

  public get constraintType(): ConstraintType {
    return this.row && this.row.attribute && this.row.attribute.constraint && this.row.attribute.constraint.type;
  }

  constructor(private i18n: I18n) {
    this.placeholder = i18n({id: 'document.key-value.attribute.placeholder', value: 'Enter attribute name'});
  }

  public onNewKey(value: string) {
    this.newKey.emit(value);
    this.keyEditing$.next(false);
  }

  public onNewValue(value: any) {
    this.newValue.emit(value);
    this.editing$.next(false);
  }

  public onInputKeyDown(event: KeyboardEvent) {
    this.inputKeyDown.emit(event);
  }

  public onValueFocus() {
    this.onFocus.emit(1);
  }

  public onKeyFocus() {
    this.onFocus.emit(0);
  }

  public onDataInputCancel() {
    this.valueFocused = false;
    if (this.editing$.value) {
      this.editing$.next(false);
      this.resetFocus.emit();
    }
  }

  public onKeyInputCancel() {
    this.keyFocused = false;
    if (this.keyEditing$.value) {
      this.keyEditing$.next(false);
      this.resetFocus.emit();
    }
  }

  public onDataInputBlur() {
    this.valueFocused = false;
    if (this.editing$.value) {
      this.editing$.next(false);
      this.resetFocus.emit();
    }
  }

  public onKeyInputBlur() {
    this.keyFocused = false;
    if (this.keyEditing$.value) {
      this.keyEditing$.next(false);
      this.resetFocus.emit();
    }
  }

  public onDataInputDblClick(event: MouseEvent) {
    event.preventDefault();
    this.startValueEditing();
  }

  public startValueEditing() {
    if (this.isEditable() && !this.editing$.value) {
      this.valueFocused = false;
      this.keyFocused = false;
      if (this.shouldDirectEditValue()) {
        this.onNewValue(this.computeDirectEditValue());
      } else {
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
    return this.permissions && this.permissions.writeWithView;
  }

  public onKeyInputDblClick(event: MouseEvent) {
    event.preventDefault();
    this.startKeyEditing();
  }

  public startKeyEditing() {
    if (this.isManageable() && !this.keyEditing$.value) {
      this.keyFocused = false;
      this.valueFocused = false;
      this.keyEditing$.next(true);
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
