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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {Constraint} from '../../../core/model/constraint';
import {DataValue} from '../../../core/model/data-value';
import {ConstraintType} from '../../../core/model/data/constraint';
import {DataCursor} from '../data-cursor';
import {CommonDataInputConfiguration, DataInputConfiguration} from '../data-input-configuration';

@Component({
  selector: 'data-input-preview',
  templateUrl: './data-input-preview.component.html',
  styleUrls: ['./data-input-preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataInputPreviewComponent implements OnChanges {
  @Input()
  public constraint: Constraint;

  @Input()
  public dataValue: DataValue;

  @Input()
  public configuration: DataInputConfiguration;

  @Input()
  public cursor: DataCursor;

  public readonly constraintType = ConstraintType;

  public hasValue: boolean;
  public commonConfiguration: CommonDataInputConfiguration;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.dataValue) {
      this.hasValue = this.dataValue && !!this.dataValue.format();
    }
    if (changes.configuration) {
      this.commonConfiguration = {...this.configuration?.common, skipValidation: true};
    }
  }
}
