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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {AsyncValidatorFn, FormBuilder, FormGroup, Validators} from '@angular/forms';

import {ResourceType} from '../../../../core/model/resource-type';
import {safeGetRandomIcon} from '../../../picker/icons';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../../../core/constants';
import * as Colors from '../../../picker/colors';
import {Resource} from '../../../../core/model/resource';
import {ProjectValidators} from '../../../../core/validators/project.validators';
import {OrganizationValidators} from '../../../../core/validators/organization.validators';
import {Organization} from '../../../../core/store/organizations/organization';
import {Project} from '../../../../core/store/projects/project';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {TemplateType} from '../../../../core/model/template';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {IconColorPickerComponent} from '../../../picker/icon-color/icon-color-picker.component';
import {select, Store} from '@ngrx/store';
import {selectProjectsByOrganizationId} from '../../../../core/store/projects/projects.state';
import {map, take} from 'rxjs/operators';
import {AppState} from '../../../../core/store/app.state';

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

  @Input()
  public initialTemplate: TemplateType;

  @Input()
  public usedCodes: string[];

  public readonly resourceTypeProject = ResourceType.Project;

  @Output()
  public submitResource = new EventEmitter<{resource: Organization | Project; template?: TemplateType}>();

  @ViewChild(IconColorPickerComponent)
  public iconColorDropdownComponent: IconColorPickerComponent;

  public selectedTemplate$ = new BehaviorSubject<TemplateType>(TemplateType.RMTW);

  public form: FormGroup;
  public color = DEFAULT_COLOR;
  public icon = DEFAULT_ICON;

  public first$: Observable<boolean>;
  public subscriptions = new Subscription();

  public readonly iconChooserLabel: string;
  private readonly colors = Colors.palette;

  constructor(
    private fb: FormBuilder,
    private projectValidators: ProjectValidators,
    private organizationValidators: OrganizationValidators,
    private i18n: I18n,
    private store$: Store<AppState>
  ) {
    this.iconChooserLabel = i18n({
      id: 'resource.new.dialog.icon.label.hint',
      value: '(click the icon to change it)',
    });
  }

  public ngOnInit() {
    this.first$ = this.store$.pipe(
      select(selectProjectsByOrganizationId(this.parentId)),
      map(projects => projects?.length === 0)
    );

    if (this.initialTemplate) {
      this.selectedTemplate$.next(this.initialTemplate);
    }

    this.createForm();
    this.color = this.colors[Math.round(Math.random() * this.colors.length)];
    this.icon = safeGetRandomIcon();
  }

  private createForm() {
    const initialCode =
      this.resourceType === ResourceType.Project ? this.createCodeForTemplate(this.selectedTemplate$.getValue()) : '';
    const firstProject = this.i18n({id: 'resource.new.dialog.firstProject', value: 'My first project'});

    this.first$.pipe(take(1)).subscribe(isFirst => {
      this.form = this.fb.group({
        code: [
          initialCode,
          [Validators.required, Validators.minLength(2), Validators.maxLength(5)],
          this.createAsyncValidator(),
        ],
        name: [this.resourceType === ResourceType.Project && isFirst ? firstProject : ''],
      });
    });
  }

  private createCodeForTemplate(type: TemplateType): string {
    let code = type.substring(0, 5);
    let i = 1;
    while ((this.usedCodes || []).includes(code)) {
      code = type.substring(0, 4) + i++;
    }

    return code;
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
    this.prefillCodeIfNeeded(type);
  }

  private prefillCodeIfNeeded(type: TemplateType) {
    if (!this.form.controls.code.touched) {
      this.form.controls.code.setValue(this.createCodeForTemplate(type));
    }
  }

  public togglePicker() {
    this.iconColorDropdownComponent.toggle();
  }

  public onIconColorChange(data: {icon: string; color: string}) {
    this.color = data.color;
    this.icon = data.icon;
  }
}
