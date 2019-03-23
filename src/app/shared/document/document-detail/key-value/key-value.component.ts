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

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Constraint, ConstraintType} from '../../../../core/model/data/constraint';
import {BehaviorSubject} from 'rxjs';
import {KeyCode} from '../../../../shared/key-code';

@Component({
  selector: 'key-value',
  templateUrl: './key-value.component.html',
  styleUrls: ['./key-value.component.scss'],
})
export class KeyValueComponent {
  @Input()
  public key: string;

  @Input()
  public value: any;

  @Input()
  public constraint: Constraint;

  @Output()
  public keyChange = new EventEmitter<string>();

  @Output()
  public valueChange = new EventEmitter<any>();

  @Output()
  public change = new EventEmitter<[string, any]>();

  @Output()
  public remove = new EventEmitter();

  @Input()
  public readOnly = false;

  @Input()
  public defaultAttribute = false;

  @Input()
  public configurable = false;

  @Output()
  public onConfigure = new EventEmitter();

  @Output()
  public onFunction = new EventEmitter();

  @Input()
  public warning: string = '';

  public constraintTypeBoolean = ConstraintType.Boolean;

  public editing$ = new BehaviorSubject(false);

  constructor(public i18n: I18n) {}

  public onNewKey($event: string) {
    this.key = $event;
    this.keyChange.emit($event);
    this.change.emit([$event, this.value]);
  }

  public onNewRowValue(value: any) {
    this.value = value;
    this.valueChange.emit(value);
    this.change.emit([this.key, value]);
    this.editing$.next(false);
  }

  public invokeRemove() {
    this.remove.emit();
  }

  public dataInputKeyDown($event: KeyboardEvent, constraint?: Constraint) {
    switch ($event.code) {
      case KeyCode.NumpadEnter:
      case KeyCode.Enter:
        if (constraint && constraint.type === ConstraintType.Boolean) {
          this.onNewRowValue(!this.value);
        } else {
          this.editing$.next(!this.editing$.value);
        }
        return;
      case KeyCode.Escape:
        this.editing$.next(false);
        return;
      case KeyCode.ArrowDown:
      case KeyCode.ArrowUp:
      case KeyCode.ArrowLeft:
      case KeyCode.ArrowRight:
      case KeyCode.F2:
        if (!this.editing$.value) {
          this.editing$.next(true);
        }
        return;
    }
  }

  public invokeConstraintConfig(): void {
    this.onConfigure.emit();
  }

  public invokeFunctionConfig(): void {
    this.onFunction.emit();
  }
}
