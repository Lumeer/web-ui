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

import {Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef, EventEmitter, Output} from '@angular/core';
import {DetailDataRow} from '../document-data.component';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DataCursor} from '../../../../data-input/data-cursor';
import {ConstraintData, ConstraintType} from '../../../../../core/model/data/constraint';
import {BehaviorSubject} from 'rxjs';
import {KeyCode} from '../../../../key-code';
import {HtmlModifier} from '../../../../utils/html-modifier';

@Component({
  selector: 'document-data-row',
  templateUrl: './document-data-row.component.html',
  styleUrls: ['./document-data-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentDataRowComponent {
  @Input()
  public row: DetailDataRow;

  @Input()
  public cursor: DataCursor;

  @Input()
  public permissions: AllowedPermissions;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public newValue = new EventEmitter<any>();

  @ViewChild('keyInput', {static: false})
  public keyInput: ElementRef<HTMLInputElement>;

  public placeholder: string;

  public keyEditing$ = new BehaviorSubject(false);

  public editing$ = new BehaviorSubject(false);

  public readonly constraintType = ConstraintType;

  constructor(private i18n: I18n) {
    this.placeholder = i18n({id: 'document.key-value.attribute.placeholder', value: 'Enter attribute name'});
  }

  public onRemove() {}

  public onAttributeType() {}

  public onAttributeFunction() {}

  public onNewKey(value: string) {
    this.keyEditing$.next(false);
  }

  public onNewValue(value: any) {
    this.newValue.emit(value);
    this.editing$.next(false);
  }

  public onDataInputKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.ArrowDown:
      case KeyCode.ArrowUp:
      case KeyCode.ArrowLeft:
      case KeyCode.ArrowRight:
      case KeyCode.F2:
        console.log('arrow or f2');
        if (!this.editing$.value) {
          this.editing$.next(true);
        }
        return;
    }
  }

  public onDataInputCancel() {
    console.log('cancel');
    this.editing$.next(false);
  }

  public onKeyInputCancel() {
    this.keyEditing$.next(false);
  }

  public onDataInputBlur() {
    console.log('blur');
    this.editing$.next(false);
  }

  public onKeyInputBlur() {
    this.editing$.next(false);
  }

  public onDataInputDblClick(event: MouseEvent) {
    event.preventDefault();
    if (this.isEditable() && !this.editing$.getValue()) {
      this.editing$.next(true);
    }
  }

  private isEditable(): boolean {
    return this.permissions && this.permissions.writeWithView;
  }

  public onKeyInputDblClick(event: MouseEvent) {
    event.preventDefault();
    if (this.isManageable() && !this.keyEditing$.getValue()) {
      this.keyEditing$.next(true);
    }
  }

  private isManageable(): boolean {
    return this.permissions && this.permissions.manageWithView;
  }
}
