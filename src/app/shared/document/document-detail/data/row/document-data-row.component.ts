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

import {Component, ChangeDetectionStrategy, Input, ViewChild, ElementRef} from '@angular/core';
import {DetailDataRow} from '../document-data.component';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DataCursor} from '../../../../data-input/data-cursor';
import {ConstraintData, ConstraintType} from '../../../../../core/model/data/constraint';
import {BehaviorSubject} from 'rxjs';
import {KeyCode} from '../../../../key-code';

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

  @ViewChild('keyInput', {static: false})
  public keyInput: ElementRef<HTMLInputElement>;

  public placeholder: string;

  public keyEditing$ = new BehaviorSubject(false);
  public editing$ = new BehaviorSubject(false);

  public readonly constraintType = ConstraintType;

  constructor(private i18n: I18n) {
    this.placeholder = i18n({id: 'document.key-value.attribute.placeholder', value: 'Enter attribute name'});
  }

  public onNewKey(value: string) {}

  public onNewValue(value: any) {}

  public dataInputKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.NumpadEnter:
      case KeyCode.Enter:
        const constraint = this.row.attribute && this.row.attribute.constraint;
        console.log('enter', constraint);
        if (constraint && constraint.type === ConstraintType.Boolean) {
          this.onNewValue(!this.row.value);
        } else {
          this.editing$.next(!this.editing$.value);
        }
        return;
      case KeyCode.Escape:
        console.log('escape');
        this.editing$.next(false);
        return;
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
    this.editing$.next(false);
  }

  public onDataInputBlur() {
    this.editing$.next(false);
  }

  public onRemove() {}

  public onAttributeType() {}

  public onAttributeFunction() {}

  public onDataInputDblClick() {
    if (this.isEditable()) {
      this.editing$.next(true);
    }
  }

  private isEditable(): boolean {
    return this.permissions && this.permissions.writeWithView;
  }

  public onKeyDblClick() {
    this.keyEditing$.next(true);
    setTimeout(() => this.keyInput.nativeElement.focus());
  }

  public onKeyBlur() {
    this.keyEditing$.next(false);
  }
}
