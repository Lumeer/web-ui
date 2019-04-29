/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';

import {AttributeQueryItem} from '../model/attribute.query-item';
import {LinkAttributeQueryItem} from '../model/link-attribute.query-item';
import {BehaviorSubject} from 'rxjs';
import {Constraint, ConstraintData, ConstraintType} from '../../../../../core/model/data/constraint';
import {KeyCode} from '../../../../key-code';

@Component({
  selector: 'attribute-value',
  templateUrl: './attribute-value.component.html',
  styleUrls: ['./attribute-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeValueComponent {
  @Input()
  public queryItem: AttributeQueryItem | LinkAttributeQueryItem;

  @Input()
  public readonly: boolean;

  @Input()
  public queryItemForm: FormGroup;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public enter = new EventEmitter();

  @Output()
  public moveLeft = new EventEmitter();

  @Output()
  public change = new EventEmitter();

  public constraintTypeBoolean = ConstraintType.Boolean;
  public editing$ = new BehaviorSubject(false);

  public get conditionValueControl(): AbstractControl {
    return this.queryItemForm && this.queryItemForm.get('conditionValue');
  }

  public onSave(value: any) {
    this.setValue(value);

    if (this.conditionValueControl && this.conditionValueControl.valid) {
      this.change.emit();
    }
    this.cancelEditing();
  }

  private setValue(value: any) {
    this.conditionValueControl && this.conditionValueControl.setValue(value);
    this.queryItem.conditionValue = value;
  }

  public setEditing() {
    this.editing$.next(true);
  }

  public cancelEditing() {
    this.editing$.next(false);
  }

  private get constraint(): Constraint {
    return this.queryItem && this.queryItem.attribute && this.queryItem.attribute.constraint;
  }

  public dataInputKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case KeyCode.NumpadEnter:
      case KeyCode.Enter:
        if (this.constraint && this.constraint.type === ConstraintType.Boolean) {
          this.onSave(!this.queryItem.conditionValue);
        } else if (!this.editing$.getValue()) {
          this.setEditing();
        }
        return;
    }
  }
}
