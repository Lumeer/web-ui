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
import {
  AbstractControl,
  UntypedFormControl,
  UntypedFormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import {Subscription} from 'rxjs';

import {ActionConstraintConfig, ConstraintType} from '@lumeer/data-filters';

import {COLOR_SUCCESS} from '../../../../../../../core/constants';
import {AllowedPermissions} from '../../../../../../../core/model/allowed-permissions';
import {AttributesResource, AttributesResourceType} from '../../../../../../../core/model/resource';
import {Rule, RuleType} from '../../../../../../../core/model/rule';
import {Attribute} from '../../../../../../../core/store/collections/collection';
import {IconColorPickerComponent} from '../../../../../../picker/icon-color/icon-color-picker.component';
import {SelectItemModel} from '../../../../../../select/select-item/select-item.model';
import {removeAllFormControls} from '../../../../../../utils/form.utils';
import {getAttributesResourceType} from '../../../../../../utils/resource.utils';
import {ModalService} from '../../../../../modal.service';
import {ActionConstraintFormControl} from './action-constraint-form-control';

@Component({
  selector: 'action-constraint-config-form',
  templateUrl: './action-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionConstraintConfigFormComponent implements OnChanges, OnDestroy {
  @Input()
  public config: ActionConstraintConfig;

  @Input()
  public form: UntypedFormGroup;

  @Input()
  public lockControl: UntypedFormControl;

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

  constructor(private modalService: ModalService) {
    this.defaultTitle = $localize`:@@constraint.action.title.default:Action`;
  }

  public get titleControl(): AbstractControl {
    return this.form.controls[ActionConstraintFormControl.Title];
  }

  public get ruleControl(): UntypedFormControl {
    return <UntypedFormControl>this.form.controls[ActionConstraintFormControl.Rule];
  }

  public get titleUserControl(): UntypedFormControl {
    return <UntypedFormControl>this.form.controls[ActionConstraintFormControl.TitleUser];
  }

  public get colorControl(): UntypedFormControl {
    return <UntypedFormControl>this.form.controls[ActionConstraintFormControl.Background];
  }

  public get iconControl(): UntypedFormControl {
    return <UntypedFormControl>this.form.controls[ActionConstraintFormControl.Icon];
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
    this.form.addControl(ActionConstraintFormControl.Icon, new UntypedFormControl(this.config?.icon));
    this.form.addControl(ActionConstraintFormControl.Title, new UntypedFormControl(title));
    this.form.addControl(ActionConstraintFormControl.TitleUser, new UntypedFormControl(title));
    this.form.addControl(
      ActionConstraintFormControl.Background,
      new UntypedFormControl(this.config?.background || COLOR_SUCCESS)
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
      new UntypedFormControl(this.config?.requiresConfirmation)
    );
    this.form.addControl(
      ActionConstraintFormControl.ConfirmationTitle,
      new UntypedFormControl(this.config?.confirmationTitle)
    );
  }

  private addRuleForm() {
    this.form.addControl(
      ActionConstraintFormControl.Rule,
      new UntypedFormControl(this.getCurrentRule()?.id, Validators.required)
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

  public configureLock() {
    const resourceType = getAttributesResourceType(this.resource);
    const collectionId = resourceType === AttributesResourceType.Collection ? this.resource.id : null;
    const linkTypeId = resourceType === AttributesResourceType.Collection ? this.resource.id : null;
    const ref = this.modalService.showAttributeLock(
      this.attribute.id,
      collectionId,
      linkTypeId,
      true,
      this.lockControl.value
    );
    ref.content.onSubmit$.subscribe(lock => this.lockControl?.setValue(lock));
  }
}

export function titleOrIconValidator(): ValidatorFn {
  return (form: UntypedFormGroup): ValidationErrors | null => {
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
