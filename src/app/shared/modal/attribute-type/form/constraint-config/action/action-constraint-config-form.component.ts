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
import {AbstractControl, FormArray, FormControl, FormGroup, Validators} from '@angular/forms';
import {ActionConstraintConfig} from '../../../../../../core/model/data/constraint-config';
import {removeAllFormControls} from '../../../../../utils/form.utils';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {ActionConstraintFormControl} from './action-constraint-form-control';
import {COLOR_SUCCESS} from '../../../../../../core/constants';
import {Subscription} from 'rxjs';
import {RuleType} from '../../../../../../core/model/rule';
import {SelectItemModel} from '../../../../../select/select-item/select-item.model';
import {AttributesResource} from '../../../../../../core/model/resource';
import {IconColorPickerComponent} from '../../../../../picker/icon-color/icon-color-picker.component';

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
  public resource: AttributesResource;

  @ViewChild(IconColorPickerComponent)
  public iconColorDropdownComponent: IconColorPickerComponent;

  public readonly formControlName = ActionConstraintFormControl;
  public readonly defaultTitle: string;

  public ruleSelectItems: SelectItemModel[];

  private savedColor: string;
  private subscription = new Subscription();

  constructor(private i18n: I18n) {
    this.defaultTitle = this.i18n({id: 'constraint.action.title.default', value: 'Action'});
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

  public get filtersControl(): FormArray {
    return <FormArray>this.form.controls[ActionConstraintFormControl.Filters];
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.resetForm();
      this.createForm();
    }
    if (changes.resource) {
      this.createRuleItems();
    }
  }

  private createRuleItems() {
    this.ruleSelectItems = (this.resource?.rules || [])
      .filter(rule => rule.type !== RuleType.AutoLink)
      .map(rule => ({id: rule.name, value: rule.name}));
  }

  private resetForm() {
    this.form.clearValidators();
    removeAllFormControls(this.form);
  }

  private createForm() {
    this.addButtonForms();
    this.addRuleForm();
    this.addConditionsForm();
  }

  private addButtonForms() {
    const currentTitle = cleanTitle(this.config?.title);
    this.form.addControl(ActionConstraintFormControl.Icon, new FormControl(this.config?.icon));
    this.form.addControl(ActionConstraintFormControl.Title, new FormControl(currentTitle || this.defaultTitle));
    this.form.addControl(ActionConstraintFormControl.TitleUser, new FormControl(currentTitle));
    this.form.addControl(
      ActionConstraintFormControl.Background,
      new FormControl(this.config?.background || COLOR_SUCCESS)
    );
    this.subscription.add(
      this.titleUserControl.valueChanges.subscribe(value => {
        this.titleControl.setValue(cleanTitle(value) || this.defaultTitle);
      })
    );
  }

  private addRuleForm() {
    const rule = this.config?.rule && this.resource?.rules?.find(r => r.name === this.config.rule);
    this.form.addControl(ActionConstraintFormControl.Rule, new FormControl(rule?.name, Validators.required));
  }

  private addConditionsForm() {
    this.form.addControl(ActionConstraintFormControl.Filters, new FormArray([]));
  }

  public ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  public onColorChange(color: string) {
    this.colorControl.setValue(color);
  }

  public togglePicker() {
    this.savedColor = this.colorControl.value;
    this.iconColorDropdownComponent?.toggle();
  }

  public onIconColorChange(data: {icon: string; color: string}) {
    this.colorControl.setValue(data.color);
    this.iconControl.setValue(data.icon);
  }
}

function cleanTitle(value: string): string {
  return (value || '').trim();
}
