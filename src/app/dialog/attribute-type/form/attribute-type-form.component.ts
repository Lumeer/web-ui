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
  ENABLED_CONSTRAINTS,
} from '../../../core/model/data/constraint';
import {Attribute} from '../../../core/store/collections/collection';

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

  public readonly types = Object.keys(ConstraintType).filter(type => ENABLED_CONSTRAINTS.includes(type));

  public form = new FormGroup({
    type: new FormControl(),
    config: new FormGroup({}),
  });

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attribute && this.attribute) {
      const type = (this.attribute.constraint && this.attribute.constraint.type) || ConstraintType.Text;
      this.typeControl.setValue(type);
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
    const constraint: Constraint = {type, config: this.createConstraintConfig(type)};
    return {...this.attribute, constraint};
  }

  private createConstraintConfig(type: ConstraintType): ConstraintConfig {
    switch (type) {
      case ConstraintType.DateTime:
        return {
          format: this.configForm.get('format').value,
          minDateTime: this.configForm.get('minDateTime').value,
          maxDateTime: this.configForm.get('maxDateTime').value,
          range: undefined, // TODO
        };
      case ConstraintType.Number:
        return {
          decimal: this.configForm.get('decimal').value,
          format: undefined, // TODO
          minValue: this.configForm.get('minValue').value,
          maxValue: this.configForm.get('maxValue').value,
          precision: undefined, // TODO
        };
      case ConstraintType.Text:
        return {
          caseStyle: this.configForm.get('caseStyle').value,
          minLength: this.configForm.get('minLength').value,
          maxLength: this.configForm.get('maxLength').value,
          regexp: undefined, // TODO
        };
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
