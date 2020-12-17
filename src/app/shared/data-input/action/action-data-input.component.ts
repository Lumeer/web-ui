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

import {Component, ChangeDetectionStrategy, Input, HostBinding, OnChanges, SimpleChanges} from '@angular/core';
import {DataCursor} from '../data-cursor';
import {ActionDataValue} from '../../../core/model/data-value/action-data.value';
import {ActionDataInputConfiguration} from '../data-input-configuration';

@Component({
  selector: 'action-data-input',
  templateUrl: './action-data-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-flex align-items-center'},
})
export class ActionDataInputComponent implements OnChanges {
  @Input()
  public cursor: DataCursor;

  @Input()
  public readonly: boolean;

  @Input()
  public value: ActionDataValue;

  @Input()
  public configuration: ActionDataInputConfiguration;

  @HostBinding('class.justify-content-center')
  public center: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.readonly && !this.readonly) {
      // TODO
    }
    if (changes.configuration) {
      this.center = this.configuration?.center;
    }
  }

  public onClick() {
    // TODO
  }
}
