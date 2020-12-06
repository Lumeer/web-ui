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

import {Component, ChangeDetectionStrategy, Input, ViewChild, HostListener} from '@angular/core';
import {AbstractControl, FormGroup} from '@angular/forms';
import {Attribute} from '../../../../../../../../core/store/collections/collection';
import {ActionConstraintFiltersFormControl} from '../../action-constraint-form-control';
import {SelectItem2Model} from '../../../../../../../select/select-item2/select-item2.model';
import {FilterBuilderComponent} from '../../../../../../../builder/filter-builder/filter-builder.component';
import {ConditionType, ConditionValue} from '../../../../../../../../core/model/attribute-filter';
import {findAttribute} from '../../../../../../../../core/store/collections/collection.util';
import {
  initialConditionType,
  initialConditionValues,
} from '../../../../../../../../core/model/data-value/data-value.utils';

@Component({
  selector: 'action-constraint-condition-form',
  templateUrl: './action-constraint-condition-form.component.html',
  styleUrls: ['./action-constraint-condition-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionConstraintConditionFormComponent {
  @Input()
  public attributes: Attribute[];

  @Input()
  public form: FormGroup;

  @Input()
  public attributeSelectItems: SelectItem2Model[];

  @ViewChild(FilterBuilderComponent)
  public filterBuilderComponent: FilterBuilderComponent;

  public get attributeIdControl(): AbstractControl {
    return this.form.controls[ActionConstraintFiltersFormControl.Attribute];
  }

  public get operatorControl(): AbstractControl {
    return this.form.controls[ActionConstraintFiltersFormControl.Operator];
  }

  public get conditionControl(): AbstractControl {
    return this.form.controls[ActionConstraintFiltersFormControl.Condition];
  }

  public get conditionValuesControl(): AbstractControl {
    return this.form.controls[ActionConstraintFiltersFormControl.ConditionValues];
  }

  public onAttributeSelect(items: SelectItem2Model[]) {
    const attribute = findAttribute(this.attributes, items[0]?.id);
    if (attribute && this.attributeIdControl.value !== attribute.id) {
      this.attributeIdControl.setValue(attribute.id);

      const condition = initialConditionType(attribute.constraint);
      this.conditionControl.setValue(condition);
      this.conditionValuesControl.setValue(initialConditionValues(condition, attribute.constraint));

      setTimeout(() => this.filterBuilderComponent?.toggle());
    }
  }

  @HostListener('click')
  public onClick() {
    this.filterBuilderComponent?.toggle();
  }

  public onValueChange(data: {condition: ConditionType; values: ConditionValue[]}) {
    this.conditionControl.setValue(data.condition);
    this.conditionValuesControl.setValue(data.values);
  }
}
