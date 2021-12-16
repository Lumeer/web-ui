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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy, SimpleChanges, ViewChild} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators} from '@angular/forms';
import {removeAllFormControls} from '../../../../../../utils/form.utils';
import {ActionConstraintFormControl} from './action-constraint-form-control';
import {COLOR_SUCCESS} from '../../../../../../../core/constants';
import {Subscription} from 'rxjs';
import {Rule, RuleType} from '../../../../../../../core/model/rule';
import {SelectItemModel} from '../../../../../../select/select-item/select-item.model';
import {AttributesResource} from '../../../../../../../core/model/resource';
import {IconColorPickerComponent} from '../../../../../../picker/icon-color/icon-color-picker.component';
import {Attribute, AttributeLock} from '../../../../../../../core/store/collections/collection';
import {AllowedPermissions} from '../../../../../../../core/model/allowed-permissions';
import {ActionConstraintConfig, ConstraintType} from '@lumeer/data-filters';

@Component({
  selector: 'action-constraint-config-form',
  templateUrl: './action-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionConstraintConfigFormComponent implements OnChanges, OnDestroy {
  @Input()
  public config: ActionConstraintConfig;

  @Input()
  public form: FormGroup;

  @Input()
  public lockControl: FormControl;

  @Input()
  public resource: AttributesResource;

  @Input()
  public attribute: Attribute;

  @Input()
  public permissions: AllowedPermissions;

  @ViewChild(IconColorPickerComponent)
  public iconColorDropdownComponent: IconColorPickerComponent;

  public readonly formControlName = ActionConstraintFormControl;
  public readonly defaultTitle: string;

  public ruleSelectItems: SelectItemModel[];
  public rules: Rule[];

  private savedColor: string;
  private subscription = new Subscription();

  constructor() {
    this.defaultTitle = $localize`:@@constraint.action.title.default:Action`;
  }

  public get titleControl(): AbstractControl {
    return this.form.controls[ActionConstraintFormControl.Title];
  }

  public get ruleControl(): FormControl {
    return <FormControl>this.form.controls[ActionConstraintFormControl.Rule];
  }

  public get titleUserControl(): FormControl {
    return <FormControl>this.form.controls[ActionConstraintFormControl.TitleUser];
  }

  public get colorControl(): FormControl {
    return <FormControl>this.form.controls[ActionConstraintFormControl.Background];
  }

  public get iconControl(): FormControl {
    return <FormControl>this.form.controls[ActionConstraintFormControl.Icon];
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.resource) {
      this.createRuleItems();
    }
    if (changes.config) {
      this.resetForm();
      this.createForm();
    }
  }

  private createRuleItems() {
    this.rules = (this.resource?.rules || []).filter(rule => rule.type !== RuleType.AutoLink);
    this.ruleSelectItems = this.rules.map(rule => ({id: rule.id, value: rule.name}));

    if (!this.getCurrentRule()) {
      this.ruleControl?.setValue(null);
    }
  }

  private resetForm() {
    this.form.clearValidators();
    removeAllFormControls(this.form);
  }

  private createForm() {
    this.addButtonForms();
    this.addConfirmationForms();
    this.addRuleForm();
  }

  private addButtonForms() {
    const currentTitle = cleanTitle(this.config?.title);
    const title = currentTitle || (this.attribute?.constraint?.type === ConstraintType.Action ? '' : this.defaultTitle);
    this.form.addControl(ActionConstraintFormControl.Icon, new FormControl(this.config?.icon));
    this.form.addControl(ActionConstraintFormControl.Title, new FormControl(title));
    this.form.addControl(ActionConstraintFormControl.TitleUser, new FormControl(title));
    this.form.addControl(
      ActionConstraintFormControl.Background,
      new FormControl(this.config?.background || COLOR_SUCCESS)
    );
    this.form.setValidators(titleOrIconValidator());
    this.subscription.add(
      this.titleUserControl.valueChanges.subscribe(value => {
        this.titleControl.setValue(cleanTitle(value));
      })
    );
  }

  private addConfirmationForms() {
    this.form.addControl(
      ActionConstraintFormControl.RequiresConfirmation,
      new FormControl(this.config?.requiresConfirmation)
    );
    this.form.addControl(
      ActionConstraintFormControl.ConfirmationTitle,
      new FormControl(this.config?.confirmationTitle)
    );
  }

  private addRuleForm() {
    this.form.addControl(
      ActionConstraintFormControl.Rule,
      new FormControl(this.getCurrentRule()?.id, Validators.required)
    );
  }

  private getCurrentRule(): Rule {
    return this.config?.rule && this.rules?.find(r => r.id === this.config.rule);
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  public togglePicker() {
    this.savedColor = this.colorControl.value;
    this.iconColorDropdownComponent?.toggle();
  }

  public onIconColorChange(data: {icon: string; color: string}) {
    this.colorControl.setValue(data.color);
    this.iconControl.setValue(data.icon);
  }

  public onIconColorRemove() {
    this.colorControl.setValue(null);
    this.iconControl.setValue(null);
  }

  public onLockChange(lock: AttributeLock) {
    this.lockControl?.setValue(lock);
  }
}

export function titleOrIconValidator(): ValidatorFn {
  return (form: FormGroup): ValidationErrors | null => {
    const icon = form.get(ActionConstraintFormControl.Icon)?.value;
    const title = form.get(ActionConstraintFormControl.Title)?.value;

    if (!icon && !title) {
      return {iconOrTitleEmpty: true};
    }

    return null;
  };
}

function cleanTitle(value: string): string {
  return (value || '').trim();
}
