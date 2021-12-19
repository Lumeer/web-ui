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

import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import {FormArray, FormControl, FormGroup} from '@angular/forms';
import {removeAllFormArrayControls} from '../../../../utils/form.utils';
import {AttributesResource} from '../../../../../core/model/resource';
import {SelectItem2Model} from '../../../../select/select-item2/select-item2.model';
import {resourceAttributesSelectItems} from '../../../../select/select-item.utils';
import {findAttribute} from '../../../../../core/store/collections/collection.util';
import {Attribute} from '../../../../../core/store/collections/collection';
import {
  AttributeFilter,
  AttributeFilterEquation,
  conditionTypeNumberOfInputs,
  ConstraintType,
  EquationOperator,
} from '@lumeer/data-filters';
import {areConditionValuesDefined} from '../../../../../core/store/navigation/query/query.util';

export enum ConstraintFiltersFormControl {
  Attribute = 'attribute',
  Operator = 'operator',
  ConstraintType = 'constraintType',
  Condition = 'condition',
  ConditionValues = 'values',
}

@Component({
  selector: 'constraint-conditions-form',
  templateUrl: './constraint-conditions-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConstraintConditionsFormComponent implements OnChanges {
  @Input()
  public filtersArray: FormArray;

  @Input()
  public equation: AttributeFilterEquation;

  @Input()
  public resource: AttributesResource;

  @Input()
  public attribute: Attribute;

  @Input()
  public label: string;

  @Input()
  public buttonLabel: string;

  public attributeSelectItems: SelectItem2Model[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.equation) {
      this.resetForm();
      this.createForm();
    }
    if (changes.resource || changes.attribute) {
      this.attributeSelectItems = resourceAttributesSelectItems(this.resource).filter(
        item => item.id !== this.attribute?.id
      );
    }
  }

  private resetForm() {
    removeAllFormArrayControls(this.filtersArray);
  }

  private createForm() {
    const operator = this.equation?.operator || EquationOperator.And;
    this.equation?.equations?.forEach(equation => {
      const attribute = findAttribute(this.resource?.attributes, equation.filter?.attributeId);
      if (attribute) {
        this.filtersArray.push(this.createFormGroup(operator, attribute, equation.filter));
      }
    });
  }

  public onAddFilter() {
    const filters = <{operator: EquationOperator}[]>this.filtersArray.value;
    const operator = filters?.find(fil => !!fil.operator)?.operator;
    this.filtersArray.push(this.createFormGroup(operator || EquationOperator.And));
  }

  private createFormGroup(operator: EquationOperator, attribute?: Attribute, filter?: AttributeFilter): FormGroup {
    return new FormGroup({
      [ConstraintFiltersFormControl.Attribute]: new FormControl(attribute?.id),
      [ConstraintFiltersFormControl.ConstraintType]: new FormControl(
        attribute?.constraint?.type || ConstraintType.Unknown
      ),
      [ConstraintFiltersFormControl.Condition]: new FormControl(filter?.condition),
      [ConstraintFiltersFormControl.ConditionValues]: new FormControl(filter?.conditionValues),
      [ConstraintFiltersFormControl.Operator]: new FormControl(operator),
    });
  }

  public onRemoveFilter(index: number) {
    this.filtersArray.removeAt(index);

    if (this.filtersArray.length === 1) {
      this.onOperatorSelect(EquationOperator.And);
    }
  }

  public onOperatorSelect(operator: EquationOperator) {
    this.filtersArray.controls.forEach(control => {
      control.patchValue({operator});
    });
    this.filtersArray.updateValueAndValidity();
  }
}

export function createActionEquationFromFormArray(filtersArray: FormArray): AttributeFilterEquation {
  const filters = <{[key in ConstraintFiltersFormControl]: any}[]>filtersArray.value;
  const equations: AttributeFilterEquation[] = (filters || [])
    .filter(fil => fil.attribute && areConditionValuesDefined(fil.condition, fil.values, fil.constraintType))
    .map(fil => {
      const numConditionValues = conditionTypeNumberOfInputs(fil.condition);
      const conditionValues = fil.values?.slice(0, numConditionValues) || [];
      return {
        filter: {attributeId: fil.attribute, condition: fil.condition, conditionValues},
        operator: fil.operator,
      };
    });
  const operator = equations.length === 1 ? EquationOperator.And : equations[0]?.operator;
  return {equations, operator};
}
