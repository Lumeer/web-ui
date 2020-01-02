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
import {ConstraintConditionValueItem, QueryConditionItem} from '../model/query-condition-item';
import {DataValue} from '../../../../core/model/data-value';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {QueryCondition, QueryConditionValue} from '../../../../core/store/navigation/query/query';
import {BehaviorSubject} from 'rxjs';
import {queryConditionNumInputs} from '../../../../core/store/navigation/query/query.util';
import {createRange} from '../../../utils/array.utils';
import {DataInputConfiguration} from '../../../data-input/data-input-configuration';
import {KeyCode} from '../../../key-code';
import {Constraint} from '../../../../core/model/constraint';
import {SelectConstraint} from '../../../../core/model/constraint/select.constraint';
import {SelectConstraintConfig, UserConstraintConfig} from '../../../../core/model/data/constraint-config';
import {UserConstraint} from '../../../../core/model/constraint/user.constraint';

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
  public selectedValues: QueryConditionValue[];

  @Input()
  public selectedCondition: QueryCondition;

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public valueChange = new EventEmitter<{condition: QueryCondition; values: QueryConditionValue[]}>();

  @Output()
  public finishEditing = new EventEmitter();

  public readonly constraintType = ConstraintType;
  public readonly configuration: DataInputConfiguration = {skipValidation: true, fromQuery: true};

  public editing$ = new BehaviorSubject(-1);
  public numInputs: number;
  public ngForIndexes: number[];

  public constraint: Constraint;

  public dataValues: DataValue[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attribute || changes.selectedValues || changes.constraintData) {
      this.constraint = this.createAndModifyConstraint();
      this.dataValues = this.createDataValues();
    }
    if (changes.selectedCondition) {
      this.numInputs = queryConditionNumInputs(this.selectedCondition);
      this.ngForIndexes = createRange(0, this.numInputs);
    }
  }

  private createAndModifyConstraint(): Constraint {
    if (!this.attribute || !this.attribute.constraint) {
      return new UnknownConstraint();
    }

    const constraint = this.attribute.constraint;
    switch (constraint.type) {
      case ConstraintType.Select:
        const selectConfig = <SelectConstraintConfig>{...constraint.config, multi: true};
        return new SelectConstraint(selectConfig);
      case ConstraintType.User:
        const userConfig = <UserConstraintConfig>{...constraint.config, multi: true};
        return new UserConstraint(userConfig);
      default:
        return constraint;
    }
  }

  private createDataValues(): DataValue[] {
    return (this.selectedValues || []).map(selectedValue => {
      const value = selectedValue && selectedValue.value;
      return this.constraint.createDataValue(value || '', this.constraintData);
    });
  }

  public focusFirstInput() {
    if (this.numInputs > 0 && !this.isEditing()) {
      this.editing$.next(0);
    }
  }

  public onConditionSelect(item: QueryConditionItem) {
    this.valueChange.emit({condition: item.value, values: this.selectedValues});
    const numInputs = queryConditionNumInputs(item.value);
    if (queryConditionNumInputs(item.value) > 0 && (!this.isEditing() || this.editing$.value >= numInputs)) {
      this.editing$.next(0);
    }
  }

  private isEditing(): boolean {
    return this.editing$.value >= 0;
  }

  public onConditionValueSelect(item: ConstraintConditionValueItem, index: number) {
    const value: QueryConditionValue = {type: item.value, value: null};

    const values = [...(this.selectedValues || [])];
    values[index] = value;

    this.valueChange.emit({condition: this.selectedCondition, values});
    this.editing$.next(-1);
  }

  public startEditing(index: number) {
    if (this.editing$.value !== index) {
      setTimeout(() => this.editing$.next(index));
    }
  }

  public onInputSave(dataValue: DataValue, index: number) {
    const value: QueryConditionValue = {type: null, value: dataValue.serialize()};

    const values = [...(this.selectedValues || [])];
    values[index] = value;

    this.valueChange.emit({condition: this.selectedCondition, values});
    this.editing$.next(-1);
  }

  public onInputCancel(index: number) {
    const dataValues = [...this.dataValues];
    dataValues[index] = dataValues[index].copy();
    this.dataValues = dataValues;

    this.editing$.next(-1);
  }

  public onKeyDown(event: KeyboardEvent, index: number) {
    switch (event.code) {
      case KeyCode.Tab:
      case KeyCode.Enter:
        this.onEnterOrTabKeyDown(event, index);
    }
  }

  public onEnterOrTabKeyDown(event: KeyboardEvent, index: number) {
    event.stopPropagation();
    event.preventDefault();

    if (event.shiftKey && event.code === KeyCode.Tab) {
      if (index > 0) {
        setTimeout(() => this.editing$.next(index - 1));
      }
      return;
    }

    if (index + 1 < this.numInputs) {
      setTimeout(() => this.editing$.next(index + 1));
    } else {
      this.finishEditing.emit();
    }
  }
}
