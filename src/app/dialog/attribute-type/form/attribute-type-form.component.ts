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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {
  Constraint,
  ConstraintConfig,
  ConstraintType,
  constraintTypesMap,
  isConstraintTypeEnabled,
} from '../../../core/model/data/constraint';
import {Attribute} from '../../../core/store/collections/collection';
import {convertToBig} from '../../../shared/utils/data.utils';

@Component({
  selector: 'attribute-type-form',
  templateUrl: './attribute-type-form.component.html',
  styleUrls: ['./attribute-type-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeTypeFormComponent implements OnChanges {
  @Input()
  public attribute: Attribute;

  @Output()
  public attributeChange = new EventEmitter<Attribute>();

  public readonly types = ['None'].concat(Object.keys(ConstraintType).filter(type => isConstraintTypeEnabled(type)));

  public form = new FormGroup({
    type: new FormControl(),
    config: new FormGroup({}),
  });

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attribute && this.attribute) {
      const type = this.attribute.constraint && this.attribute.constraint.type;
      this.typeControl.setValue(type || 'None');
    }
  }

  public onSubmit() {
    if (this.form.invalid) {
      return;
    }

    const attribute = this.createModifiedAttribute();
    this.attributeChange.emit(attribute);
  }

  private createModifiedAttribute(): Attribute {
    const type = constraintTypesMap[this.typeControl.value];
    const constraint: Constraint = type ? {type, config: this.createConstraintConfig(type)} : null;
    return {...this.attribute, constraint};
  }

  private createConstraintConfig(type: ConstraintType): ConstraintConfig {
    switch (type) {
      case ConstraintType.DateTime:
        return {
          format: this.configForm.get('format').value,
          minValue: this.configForm.get('minValue').value,
          maxValue: this.configForm.get('maxValue').value,
          range: undefined, // TODO
        };
      case ConstraintType.Number:
        return {
          decimal: this.configForm.get('decimal').value,
          format: undefined, // TODO
          minValue: convertToBig(this.configForm.get('minValue').value),
          maxValue: convertToBig(this.configForm.get('maxValue').value),
          precision: undefined, // TODO
        };
      case ConstraintType.Percentage:
        return {
          format: undefined, // TODO
          decimals: this.configForm.get('decimals').value,
          minValue: this.configForm.get('minValue').value,
          maxValue: this.configForm.get('maxValue').value,
        };
      case ConstraintType.Text:
        return {
          caseStyle: this.configForm.get('caseStyle').value,
          minLength: this.configForm.get('minLength').value,
          maxLength: this.configForm.get('maxLength').value,
          regexp: undefined, // TODO
        };
      case ConstraintType.Color:
        return {};
      default:
        return null;
    }
  }

  public get typeControl(): AbstractControl {
    return this.form.get('type');
  }

  public get configForm(): AbstractControl {
    return this.form.get('config');
  }
}
