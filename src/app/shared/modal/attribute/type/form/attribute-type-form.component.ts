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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import {AbstractControl, FormArray, FormControl, FormGroup} from '@angular/forms';
import {AddressConstraintFormControl} from './constraint-config/address/address-constraint-form-control';
import {CoordinatesConstraintFormControl} from './constraint-config/coordinates/coordinates-constraint-form-control';
import {PercentageConstraintFormControl} from './constraint-config/percentage/percentage-constraint-form-control';
import {SelectConstraintFormControl} from './constraint-config/select/select-constraint-form-control';
import {
  isSelectConstraintOptionValueRemoved,
  parseSelectOptionsFromForm,
} from './constraint-config/select/select-constraint.utils';
import {UserConstraintFormControl} from './constraint-config/user/user-constraint-form-control';
import {DurationConstraintFormControl} from './constraint-config/duration/duration-constraint-form-control';
import {Attribute, AttributeFunction} from '../../../../../core/store/collections/collection';
import {NotificationService} from '../../../../../core/notifications/notification.service';
import {createConstraint} from '../../../../utils/constraint/create-constraint';
import {constraintTypesMap} from '../../../../../core/model/constraint';
import {convertToBig} from '../../../../utils/data.utils';
import {DatetimeConstraintFormControl} from './constraint-config/datetime/datetime-constraint-form-control';
import {TextConstraintFormControl} from './constraint-config/text/text-constraint-form-control';
import {NumberConstraintFormControl} from './constraint-config/number/number-constraint-form-control';
import {LinkConstraintFormControl} from './constraint-config/link/link-constraint-form-control';
import {ActionConstraintFormControl} from './constraint-config/action/action-constraint-form-control';
import {AttributesResource} from '../../../../../core/model/resource';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Constraint, ConstraintConfig, ConstraintType, SelectConstraintConfig} from '@lumeer/data-filters';
import {ViewConstraintFormControl} from './constraint-config/view/view-constraint-form-control';
import {isUsedConstraintAttribute} from '../../../../utils/attribute.utils';

@Component({
  selector: 'attribute-type-form',
  templateUrl: './attribute-type-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AttributeTypeFormComponent implements OnChanges {
  @Input()
  public resource: AttributesResource;

  @Input()
  public attribute: Attribute;

  @Input()
  public permissions: AllowedPermissions;

  @Output()
  public attributeChange = new EventEmitter<Attribute>();

  public form = new FormGroup({
    type: new FormControl(),
    config: new FormGroup({}),
    lock: new FormControl(),
  });

  constructor(private notificationService: NotificationService) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (this.attributeTypeChanges(changes.attribute) && this.attribute) {
      this.typeControl.setValue(this.attribute.constraint?.type || ConstraintType.Unknown);
    }
  }

  private attributeTypeChanges(change: SimpleChange): boolean {
    return (
      change &&
      (!change.previousValue || change.previousValue.constraint?.type !== change.currentValue?.constraint?.type)
    );
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
    const type: ConstraintType = constraintTypesMap[this.typeControl.value];
    const config = this.createConstraintConfig(type);
    const constraint: Constraint = type ? createConstraint(type, config) : null;
    const attributeFunction: AttributeFunction = constraint.allowEditFunction ? this.attribute?.function : null;
    const lock = this.lockControl.value;
    return {...this.attribute, constraint, function: attributeFunction, lock: lock || this.attribute.lock};
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
          asUtc: this.configForm.get(DatetimeConstraintFormControl.Utc).value,
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
          style: this.configForm.get(PercentageConstraintFormControl.Style).value,
          color: this.configForm.get(PercentageConstraintFormControl.Color).value,
        };
      case ConstraintType.Select:
        const displayValues = this.configForm.get(SelectConstraintFormControl.DisplayValues).value;
        return {
          multi: this.configForm.get(SelectConstraintFormControl.Multi).value,
          selectionListId: this.configForm.get(SelectConstraintFormControl.SelectionList).value,
          displayValues,
          options: parseSelectOptionsFromForm(
            this.configForm.get(SelectConstraintFormControl.Options) as FormArray,
            displayValues
          ),
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
          type: this.configForm.get(UserConstraintFormControl.Type).value,
        };
      case ConstraintType.Link:
        return {
          openInApp: this.configForm.get(LinkConstraintFormControl.OpenInApp)?.value,
        };
      case ConstraintType.Action:
        const requiresConfirmation = this.configForm.get(ActionConstraintFormControl.RequiresConfirmation).value;
        return {
          title: this.configForm.get(ActionConstraintFormControl.Title).value,
          icon: this.configForm.get(ActionConstraintFormControl.Icon).value,
          background: this.configForm.get(ActionConstraintFormControl.Background).value,
          rule: this.configForm.get(ActionConstraintFormControl.Rule).value,
          requiresConfirmation,
          confirmationTitle: requiresConfirmation
            ? this.configForm.get(ActionConstraintFormControl.ConfirmationTitle).value?.trim()
            : null,
        };
      case ConstraintType.View:
        return {
          multi: this.configForm.get(ViewConstraintFormControl.Multi).value,
          openInNewWindow: this.configForm.get(ViewConstraintFormControl.OpenInNewWindow).value,
        };
      default:
        return null;
    }
  }

  private confirmAndSave(attribute: Attribute) {
    if (this.checkWarningBeforeSave(attribute)) {
      this.attributeChange.emit(attribute);
    }
  }

  private checkWarningBeforeSave(attribute: Attribute): boolean {
    if (this.shouldWarnAboutDeletedFiles(attribute)) {
      this.showFilesConstraintChangePrompt(attribute);
      return false;
    }
    switch (attribute.constraint?.type) {
      case ConstraintType.Select:
        return this.checkWarningBeforeSaveSelect(attribute);
      default:
        return true;
    }
  }

  private shouldWarnAboutDeletedFiles(attribute: Attribute): boolean {
    return (
      isUsedConstraintAttribute(this.attribute, ConstraintType.Files) &&
      attribute.constraint.type !== ConstraintType.Files
    );
  }

  private checkWarningBeforeSaveSelect(attribute: Attribute): boolean {
    const previousConfig = this.attribute.constraint.config as SelectConstraintConfig;
    const nextConfig = attribute.constraint.config as SelectConstraintConfig;

    if (
      isUsedConstraintAttribute(this.attribute, ConstraintType.Select) &&
      isSelectConstraintOptionValueRemoved(previousConfig, nextConfig)
    ) {
      this.showSelectValueChangePrompt(attribute);
      return false;
    }
    return true;
  }

  private showFilesConstraintChangePrompt(attribute: Attribute) {
    const title = $localize`:@@constraint.files.modify.constraint.title:Delete all files?`;
    const message = $localize`:@@constraint.files.modify.constraint.message:Changing the constraint type from 'File attachment' will permanently remove all attachments in this column. Do you want to proceed?`;
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.attributeChange.emit(attribute));
  }

  private showSelectValueChangePrompt(attribute: Attribute) {
    const title = $localize`:@@constraint.select.modify.value.title:Remove options?`;
    const message = $localize`:@@constraint.select.modify.value.message:You are modifying the value of an option which might be used in some records. This will make those records value invalid. Do you want to proceed?`;
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.attributeChange.emit(attribute));
  }

  public get typeControl(): AbstractControl {
    return this.form.get('type');
  }

  public get configForm(): AbstractControl {
    return this.form.get('config');
  }

  public get lockControl(): AbstractControl {
    return this.form.get('lock');
  }
}
