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
import {QueryCondition, QueryConditionValue} from '../../../../core/store/navigation/query/query';
import {BehaviorSubject} from 'rxjs';
import {queryConditionNumInputs} from '../../../../core/store/navigation/query/query.util';
import {ConstraintConditionType} from '../../../../core/model/data/constraint-condition';

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
  public selectedValue: QueryConditionValue;

  @Input()
  public selectedCondition: QueryCondition;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public valueChange = new EventEmitter<{condition: QueryCondition; value: QueryConditionValue}>();

  public readonly constraintType = ConstraintType;

  public editing$ = new BehaviorSubject(false);
  public numInputs: number;

  public dataValue: DataValue;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attribute || changes.selectedValue) {
      this.dataValue = this.createDataValue();
    }
    if (changes.selectedCondition) {
      this.numInputs = queryConditionNumInputs(this.selectedCondition);
    }
  }

  private createDataValue(): DataValue {
    const value = ((this.selectedValue && this.selectedValue.values) || [])[0];
    return ((this.attribute && this.attribute.constraint) || new UnknownConstraint()).createDataValue(
      value,
      DataValueInputType.Typed,
      this.constraintData
    );
  }

  public onInputDoubleClick() {
    if (!this.editing$.value) {
      this.editing$.next(true);
    }
  }

  public onConditionSelect(item: QueryConditionItem) {
    this.valueChange.emit({condition: item.value, value: this.selectedValue});
  }

  public onInputCancel() {
    this.editing$.next(false);
  }

  public onInputSave(dataValue: DataValue) {
    const value: QueryConditionValue = {type: null, values: [dataValue.serialize()]};
    this.valueChange.emit({condition: this.selectedCondition, value});
    this.editing$.next(false);
  }

  public onConditionValueSelect(item: ConstraintConditionType) {
    const value: QueryConditionValue = {type: item, values: []};
    this.valueChange.emit({condition: this.selectedCondition, value});
    this.editing$.next(false);
  }
}
