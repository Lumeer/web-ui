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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {Attribute} from '../../../../core/store/collections/collection';
import {QueryConditionItem} from '../model/query-condition-item';
import {DataValue, DataValueInputType} from '../../../../core/model/data-value';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';

@Component({
  selector: 'filter-builder-content',
  templateUrl: './filter-builder-content.component.html',
  styleUrls: ['./filter-builder-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FilterBuilderContentComponent implements OnChanges {
  @Input()
  public attribute: Attribute;

  @Input()
  public selectedValue: any;

  @Input()
  public selectedCondition: string;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public valueChange = new EventEmitter<{condition: string; value: any}>();

  public readonly constraintType = ConstraintType;

  public dataValue: DataValue;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attribute || changes.value) {
      this.dataValue = this.createDataValue();
    }
  }

  private createDataValue(): DataValue {
    return ((this.attribute && this.attribute.constraint) || new UnknownConstraint()).createDataValue(
      this.selectedValue,
      DataValueInputType.Typed,
      this.constraintData
    );
  }

  public onConditionSelect(item: QueryConditionItem) {
    this.valueChange.emit({condition: item.value, value: this.selectedValue});
  }
}
