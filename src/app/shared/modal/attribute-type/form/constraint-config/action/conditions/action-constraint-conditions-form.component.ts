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
import {
  AttributeFilter,
  AttributeFilterEquation,
  EquationOperator,
} from '../../../../../../../core/model/attribute-filter';
import {removeAllFormArrayControls} from '../../../../../../utils/form.utils';
import {ActionConstraintFiltersFormControl} from '../action-constraint-form-control';
import {AttributesResource} from '../../../../../../../core/model/resource';
import {SelectItem2Model} from '../../../../../../select/select-item2/select-item2.model';
import {resourceAttributesSelectItems} from '../../../../../../select/select-item.utils';

@Component({
  selector: 'action-constraint-conditions-form',
  templateUrl: './action-constraint-conditions-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionConstraintConditionsFormComponent implements OnChanges {
  @Input()
  public form: FormArray;

  @Input()
  public equation: AttributeFilterEquation;

  @Input()
  public resource: AttributesResource;

  public attributeSelectItems: SelectItem2Model[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.options) {
      this.resetForm();
      this.createForm();
    }
    if (changes.resource) {
      this.attributeSelectItems = resourceAttributesSelectItems(this.resource);
    }
  }

  private resetForm() {
    removeAllFormArrayControls(this.form);
  }

  private createForm() {
    const operator = this.equation.operator || EquationOperator.And;
    this.equation.equations?.forEach(equation => this.form.push(this.createFormGroup(operator, equation.filter)));
  }

  public onAddFilter() {
    // TODO find operator
    this.form.push(this.createFormGroup(EquationOperator.And));
  }

  private createFormGroup(operator: EquationOperator, filter?: AttributeFilter): FormGroup {
    return new FormGroup({
      [ActionConstraintFiltersFormControl.Attribute]: new FormControl(filter?.attributeId),
      [ActionConstraintFiltersFormControl.Condition]: new FormControl(filter?.condition),
      [ActionConstraintFiltersFormControl.ConditionValues]: new FormControl(filter?.conditionValues),
      [ActionConstraintFiltersFormControl.Operator]: new FormControl(operator),
    });
  }

  public onRemoveFilter(index: number) {
    this.form.removeAt(index);
  }
}
