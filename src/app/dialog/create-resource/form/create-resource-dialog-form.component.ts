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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AsyncValidatorFn, FormBuilder, FormGroup, Validators} from '@angular/forms';

import {ResourceType} from '../../../core/model/resource-type';
import {safeGetRandomIcon} from '../../../shared/picker/icon-picker/icons';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../../core/constants';
import * as Colors from '../../../shared/picker/color-picker/colors';
import {Resource} from '../../../core/model/resource';
import {ProjectValidators} from '../../../core/validators/project.validators';
import {OrganizationValidators} from '../../../core/validators/organization.validators';
import {Organization} from '../../../core/store/organizations/organization';
import {Project} from '../../../core/store/projects/project';
import {BehaviorSubject} from 'rxjs';
import {TemplateType} from '../../../core/model/template';

@Component({
  selector: 'create-resource-dialog-form',
  templateUrl: './create-resource-dialog-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateResourceDialogFormComponent implements OnInit {
  @Input()
  public parentId: string;

  @Input()
  public resourceType: ResourceType;

  @Output()
  public submitResource = new EventEmitter<{resource: Organization | Project; template?: TemplateType}>();

  public selectedTemplate$ = new BehaviorSubject<TemplateType>(TemplateType.Empty);

  public form: FormGroup;
  public color = DEFAULT_COLOR;
  public icon = DEFAULT_ICON;

  private readonly colors = Colors.palette;

  constructor(
    private fb: FormBuilder,
    private projectValidators: ProjectValidators,
    private organizationValidators: OrganizationValidators
  ) {}

  public ngOnInit() {
    this.createForm();
    this.color = this.colors[Math.round(Math.random() * this.colors.length)];
    this.icon = safeGetRandomIcon();
  }

  private createForm() {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(5)], this.createAsyncValidator()],
      name: [''],
    });
  }

  public onEnter(event: any) {
    // enter is somehow propagated to dropdown and throws error
    event.preventDefault();
    event.stopPropagation();
  }

  private createAsyncValidator(): AsyncValidatorFn {
    if (this.resourceType === ResourceType.Organization) {
      return this.organizationValidators.uniqueCode();
    } else if (this.resourceType === ResourceType.Project) {
      this.projectValidators.setOrganizationId(this.parentId);
      return this.projectValidators.uniqueCode();
    }

    return null;
  }

  private createResourceObject(): Resource {
    return {
      name: this.form.get('name').value,
      code: this.form.get('code').value,
      color: this.color,
      icon: this.icon,
      description: '',
    };
  }

  public onSubmit() {
    const resource = this.createResourceObject();
    if (this.resourceType === ResourceType.Organization) {
      this.submitResource.emit({resource});
    } else if (this.resourceType === ResourceType.Project) {
      const template = this.selectedTemplate$.getValue();
      this.submitResource.emit({resource: {...resource, organizationId: this.parentId}, template});
    }
  }

  public onTemplateSelected(type: TemplateType) {
    this.selectedTemplate$.next(type);
  }
}
