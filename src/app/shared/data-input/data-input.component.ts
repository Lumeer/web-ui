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

import {ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, Output} from '@angular/core';
import {Constraint, ConstraintType} from '../../core/model/data/constraint';
import {KeyCode} from '../key-code';

@Component({
  selector: 'data-input',
  templateUrl: './data-input.component.html',
  styleUrls: ['./data-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataInputComponent {
  @Input()
  public constraint: Constraint;

  @Input()
  public focus: boolean;

  @Input()
  public readonly: boolean;

  @Input()
  public value: any;

  @Output()
  public valueChange = new EventEmitter<any>();

  @Output()
  public save = new EventEmitter<any>();

  @Output()
  public cancel = new EventEmitter();

  public readonly constraintType = ConstraintType;

  public onValueChange(value: any) {
    this.valueChange.emit(value);
  }
}
