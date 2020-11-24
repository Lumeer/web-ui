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
import {ConstraintData, ConstraintType, constraintTypesMap} from '../../../../core/model/data/constraint';
import {ConstraintConfig, SelectConstraintConfig} from '../../../../core/model/data/constraint-config';
import {convertToBig} from '../../../utils/data.utils';
import {DatetimeConstraintFormControl} from './constraint-config/datetime/datetime-constraint-form-control';
import {TextConstraintFormControl} from './constraint-config/text/text-constraint-form-control';
import {NumberConstraintFormControl} from './constraint-config/number/number-constraint-form-control';
import {escapeHtml, isNotNullOrUndefined} from '../../../utils/common.utils';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {uniqueValues} from '../../../utils/array.utils';
import {LinkConstraintFormControl} from './constraint-config/link/link-constraint-form-control';

@Component({
  selector: 'attribute-type-form',
  templateUrl: './attribute-type-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeTypeFormComponent implements OnChanges {
  @Input()
  public attribute: Attribute;

  @Input()
  public dataValues: any[];

  @Input()
  public constraintData: ConstraintData;

  @Output()
  public attributeChange = new EventEmitter<Attribute>();

  public form = new FormGroup({
    type: new FormControl(),
    config: new FormGroup({}),
  });

  public uniqueValues: any[];

  constructor(private i18n: I18n, private notificationService: NotificationService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.attribute && this.attribute) {
      this.typeControl.setValue(this.attribute.constraint?.type || ConstraintType.Unknown);
    }
    if (changes.uniqueValues || changes.constraintData || changes.attribute) {
      this.uniqueValues = this.mapValues();
    }
  }

  private mapValues(): any[] {
    const constraint = this.attribute?.constraint || new UnknownConstraint();
    const values = (this.dataValues || [])
      .map(value => constraint.createDataValue(value, this.constraintData).format())
      .filter(value => isNotNullOrUndefined(value) && value !== '');
    return uniqueValues(values);
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
          range: undefined,
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
          minValue: convertToBig(this.configForm.get(NumberConstraintFormControl.MinValue).value),
          maxValue: convertToBig(this.configForm.get(NumberConstraintFormControl.MaxValue).value),
          decimals: this.configForm.get(NumberConstraintFormControl.Decimals).value,
          separated: this.configForm.get(NumberConstraintFormControl.Separated).value,
          compact: this.configForm.get(NumberConstraintFormControl.Compact).value,
          forceSign: this.configForm.get(NumberConstraintFormControl.ForceSign).value,
          negative: this.configForm.get(NumberConstraintFormControl.Negative).value,
          currency: this.configForm.get(NumberConstraintFormControl.Currency).value,
        };
      case ConstraintType.Percentage:
        return {
          format: undefined,
          decimals: this.configForm.get(PercentageConstraintFormControl.Decimals).value,
          minValue: this.configForm.get(PercentageConstraintFormControl.MinValue).value,
          maxValue: this.configForm.get(PercentageConstraintFormControl.MaxValue).value,
        };
      case ConstraintType.Select:
        const displayValues = this.configForm.get(SelectConstraintFormControl.DisplayValues).value;
        const options = this.configForm
          .get(SelectConstraintFormControl.Options)
          .value.filter(option => option.value || option.value === 0)
          .map(option => ({...option, value: escapeHtml(option.value), displayValue: escapeHtml(option.displayValue)}));
        return {
          multi: this.configForm.get(SelectConstraintFormControl.Multi).value,
          displayValues,
          options: displayValues ? options : options.map(option => ({...option, displayValue: undefined})),
        };
      case ConstraintType.Text:
        return {
          caseStyle: this.configForm.get(TextConstraintFormControl.CaseStyle).value,
          minLength: this.configForm.get(TextConstraintFormControl.MinLength).value,
          maxLength: this.configForm.get(TextConstraintFormControl.MaxLength).value,
          regexp: undefined,
        };
      case ConstraintType.User:
        return {
          multi: this.configForm.get(UserConstraintFormControl.Multi).value,
          externalUsers: this.configForm.get(UserConstraintFormControl.ExternalUsers).value,
          onlyIcon: !this.configForm.get(UserConstraintFormControl.OnlyIcon).value,
        };
      case ConstraintType.Link:
        return {
          openInApp: this.configForm.get(LinkConstraintFormControl.OpenInApp)?.value,
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
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.attributeChange.emit(attribute));
  }

  public get typeControl(): AbstractControl {
    return this.form.get('type');
  }

  public get configForm(): AbstractControl {
    return this.form.get('config');
  }
}
