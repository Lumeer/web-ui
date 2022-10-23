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
import {AbstractControl, UntypedFormControl, UntypedFormGroup} from '@angular/forms';
import {UserConstraintFormControl} from './user-constraint-form-control';
import {removeAllFormControls} from '../../../../../../utils/form.utils';
import {UserConstraintConfig, UserConstraintType} from '@lumeer/data-filters';
import {SelectItemModel} from '../../../../../../select/select-item/select-item.model';
import {parseSelectTranslation} from '../../../../../../utils/translation.utils';
import {objectValues} from '../../../../../../utils/common.utils';

@Component({
  selector: 'user-constraint-config-form',
  templateUrl: './user-constraint-config-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserConstraintConfigFormComponent implements OnChanges {
  @Input()
  public config: UserConstraintConfig;

  @Input()
  public form: UntypedFormGroup;

  public readonly formControlName = UserConstraintFormControl;
  public readonly typeItems: SelectItemModel[];

  constructor() {
    this.typeItems = this.createTypeItems();
  }

  private createTypeItems(): SelectItemModel[] {
    return objectValues(UserConstraintType).map(type => ({
      id: type,
      value: parseSelectTranslation(
        $localize`:@@constraint.usersAndTeams.type:{type, select, users {Only Users} teams {Only Teams} usersAndTeams {Users and Teams}}`,
        {type}
      ),
    }));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config) {
      this.resetForm();
      this.createForm();
    }
  }

  private resetForm() {
    this.form.clearValidators();
    removeAllFormControls(this.form);
  }

  private createForm() {
    this.form.addControl(UserConstraintFormControl.ExternalUsers, new UntypedFormControl(this.config?.externalUsers));
    this.form.addControl(UserConstraintFormControl.Multi, new UntypedFormControl(this.config?.multi));
    this.form.addControl(UserConstraintFormControl.OnlyIcon, new UntypedFormControl(!this.config?.onlyIcon));
    this.form.addControl(
      UserConstraintFormControl.Type,
      new UntypedFormControl(this.config?.type || UserConstraintType.Users)
    );
  }

  public get typeControl(): AbstractControl {
    return this.form.get(UserConstraintFormControl.Type);
  }

  public onTypeSelect(type: string) {
    this.typeControl.setValue(type);
  }
}
