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
import {AbstractControl, FormControl, FormGroup} from '@angular/forms';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {AddressConstraintFormControl} from './constraint-config/address/address-constraint-form-control';
import {CoordinatesConstraintFormControl} from './constraint-config/coordinates/coordinates-constraint-form-control';
import {PercentageConstraintFormControl} from './constraint-config/percentage/percentage-constraint-form-control';
import {SelectConstraintFormControl} from './constraint-config/select/select-constraint-form-control';
import {
  isSelectConstraintOptionValueRemoved,
  isUsedSelectConstraintAttribute,
} from './constraint-config/select/select-constraint.utils';
import {UserConstraintFormControl} from './constraint-config/user/user-constraint-form-control';
import {DurationConstraintFormControl} from './constraint-config/duration/duration-constraint-form-control';
import {Attribute} from '../../../../core/store/collections/collection';
import {NotificationService} from '../../../../core/notifications/notification.service';
import {Constraint} from '../../../../core/model/constraint';
import {createConstraint} from '../../../utils/constraint/create-constraint';
import {ConstraintType, constraintTypesMap} from '../../../../core/model/data/constraint';
import {ConstraintConfig, SelectConstraintConfig} from '../../../../core/model/data/constraint-config';
import {convertToBig} from '../../../utils/data.utils';
import {DatetimeConstraintFormControl} from './constraint-config/datetime/datetime-constraint-form-control';
import {TextConstraintFormControl} from './constraint-config/text/text-constraint-form-control';
import {NumberConstraintFormControl} from './constraint-config/number/number-constraint-form-control';

@Component({
  selector: 'attribute-type-form',
  templateUrl: './attribute-type-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeTypeFormComponent implements OnChanges {
  @Input()
  public attribute: Attribute;

  @Output()
  public attributeChange = new EventEmitter<Attribute>();

  public form = new FormGroup({
    type: new FormControl(),
    config: new FormGroup({}),
  });

  constructor(private i18n: I18n, private notificationService: NotificationService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attribute && this.attribute) {
      const type = this.attribute.constraint && this.attribute.constraint.type;
      this.typeControl.setValue(type || ConstraintType.Unknown);
    }
  }

  public onSubmit() {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const attribute = this.createModifiedAttribute();
    this.confirmAndSave(attribute);
  }

  private createModifiedAttribute(): Attribute {
    const type = constraintTypesMap[this.typeControl.value];
    const config = this.createConstraintConfig(type);
    const constraint: Constraint = type ? createConstraint(type, config) : null;
    return {...this.attribute, constraint};
  }

  private createConstraintConfig(type: ConstraintType): ConstraintConfig {
    switch (type) {
      case ConstraintType.Address:
        return {
          fields: this.configForm.get(AddressConstraintFormControl.Fields).value,
        };
      case ConstraintType.Color:
        return {};
      case ConstraintType.Coordinates:
        return {
          format: this.configForm.get(CoordinatesConstraintFormControl.Format).value,
          precision: this.configForm.get(CoordinatesConstraintFormControl.Precision).value,
        };
      case ConstraintType.DateTime:
        return {
          format:
            this.configForm.get(DatetimeConstraintFormControl.Format).value ||
            this.configForm.get(DatetimeConstraintFormControl.CustomFormat).value,
          minValue: this.configForm.get(DatetimeConstraintFormControl.MinValue).value,
          maxValue: this.configForm.get(DatetimeConstraintFormControl.MaxValue).value,
          range: undefined, // TODO
        };
      case ConstraintType.Duration:
        return {
          type: this.configForm.get(DurationConstraintFormControl.Type).value,
          conversions: this.configForm
            .get(DurationConstraintFormControl.Conversions)
            .value.reduce((map, value) => ({...map, [value.unit]: value.value}), {}),
        };
      case ConstraintType.Number:
        return {
          decimal: this.configForm.get(NumberConstraintFormControl.Decimal).value,
          format: undefined, // TODO
          minValue: convertToBig(this.configForm.get(NumberConstraintFormControl.MinValue).value),
          maxValue: convertToBig(this.configForm.get(NumberConstraintFormControl.MaxValue).value),
          precision: undefined, // TODO
        };
      case ConstraintType.Percentage:
        return {
          format: undefined, // TODO
          decimals: this.configForm.get(PercentageConstraintFormControl.Decimals).value,
          minValue: this.configForm.get(PercentageConstraintFormControl.MinValue).value,
          maxValue: this.configForm.get(PercentageConstraintFormControl.MaxValue).value,
        };
      case ConstraintType.Select:
        return {
          multi: this.configForm.get(SelectConstraintFormControl.Multi).value,
          displayValues: this.configForm.get(SelectConstraintFormControl.DisplayValues).value,
          options: this.configForm
            .get(SelectConstraintFormControl.Options)
            .value.filter(option => option.value || option.value === 0),
        };
      case ConstraintType.Text:
        return {
          caseStyle: this.configForm.get(TextConstraintFormControl.CaseStyle).value,
          minLength: this.configForm.get(TextConstraintFormControl.MinLength).value,
          maxLength: this.configForm.get(TextConstraintFormControl.MaxLength).value,
          regexp: undefined, // TODO
        };
      case ConstraintType.User:
        return {
          externalUsers: this.configForm.get(UserConstraintFormControl.ExternalUsers).value,
        };
      default:
        return null;
    }
  }

  private confirmAndSave(attribute: Attribute) {
    if (attribute.constraint && attribute.constraint.type === ConstraintType.Select) {
      this.confirmAndSaveSelect(attribute);
      return;
    }

    this.attributeChange.emit(attribute);
  }

  private confirmAndSaveSelect(attribute: Attribute) {
    if (!isUsedSelectConstraintAttribute(this.attribute)) {
      this.attributeChange.emit(attribute);
      return;
    }

    const previousConfig = this.attribute.constraint.config as SelectConstraintConfig;
    const nextConfig = attribute.constraint.config as SelectConstraintConfig;

    if (isSelectConstraintOptionValueRemoved(previousConfig, nextConfig)) {
      this.showSelectValueChangePrompt(attribute);
    } else {
      this.attributeChange.emit(attribute);
    }
  }

  private showSelectValueChangePrompt(attribute: Attribute) {
    const title = this.i18n({id: 'constraint.select.modify.value.title', value: 'Remove options?'});
    const message = this.i18n({
      id: 'constraint.select.modify.value.message',
      value:
        'You are modifying the value of an option which might be used in some records. This will make those records value invalid. Do you want to proceed?',
    });
    const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
    const noButtonText = this.i18n({id: 'button.no', value: 'No'});

    this.notificationService.confirm(message, title, [
      {text: noButtonText},
      {text: yesButtonText, action: () => this.attributeChange.emit(attribute), bold: false},
    ]);
  }

  public get typeControl(): AbstractControl {
    return this.form.get('type');
  }

  public get configForm(): AbstractControl {
    return this.form.get('config');
  }
}
