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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, AsyncValidatorFn, FormControl, FormGroup, Validators} from '@angular/forms';

import {ActivatedRoute} from '@angular/router';
import {Action, Store} from '@ngrx/store';
import {map, take} from 'rxjs/operators';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../core/constants';
import {AppState} from '../../core/store/app.state';
import {DialogService} from '../dialog.service';
import {ResourceType} from '../../core/model/resource-type';
import {ResourceModel} from '../../core/model/resource.model';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {ProjectValidators} from '../../core/validators/project.validators';
import {OrganizationValidators} from '../../core/validators/organization.validators';
import {selectOrganizationById} from '../../core/store/organizations/organizations.state';
import {Subscription} from 'rxjs';
import {DialogPath, dialogPathsMap} from '../dialog-path';
import {OrganizationModel} from '../../core/store/organizations/organization.model';
import {selectProjectsByOrganizationId} from '../../core/store/projects/projects.state';
import * as Colors from '../../shared/picker/color-picker/colors';
import * as Icons from '../../shared/picker/icon-picker/icons';

@Component({
  selector: 'create-resource-dialog',
  templateUrl: './create-resource-dialog.component.html',
})
export class CreateResourceDialogComponent implements OnInit, OnDestroy {
  public form: FormGroup;

  public color: string = DEFAULT_COLOR;
  public icon: string = DEFAULT_ICON;

  public resourceType: ResourceType;

  public parentId: string;
  public parentOrganization: OrganizationModel;
  public isFirstProject: boolean;
  public subscriptions = new Subscription();

  private icons = Icons.solid;
  private colors = Colors.palette;

  constructor(
    private dialogService: DialogService,
    private projectValidators: ProjectValidators,
    private organizationValidators: OrganizationValidators,
    private route: ActivatedRoute,
    private store: Store<AppState>
  ) {
    this.createForm();
  }

  public get codeInput(): AbstractControl {
    return this.form.get('code');
  }

  public get nameInput(): AbstractControl {
    return this.form.get('name');
  }

  public ngOnInit() {
    this.reset();
    this.parseResourceType();
    this.color = this.colors[Math.round(Math.random() * this.colors.length)];
    this.icon = this.icons[Math.round(Math.random() * this.icons.length)];
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private createForm() {
    this.form = new FormGroup({
      code: new FormControl('', [Validators.required, Validators.minLength(2), Validators.maxLength(5)]),
      name: new FormControl(''),
    });
  }

  public reset() {
    this.color = DEFAULT_COLOR;
    this.icon = DEFAULT_ICON;
    this.form.reset();
  }

  public onSubmit() {
    const callback = this.dialogService.callback;

    const action = this.createResourceAction();
    if (action) {
      this.store.dispatch(action);
    }

    if (!callback) {
      this.dialogService.closeDialog();
    }
  }

  public canShowContent(): Boolean {
    return this.resourceType === ResourceType.Organization || !!this.parentOrganization;
  }

  private createAsyncValidator(): AsyncValidatorFn {
    if (this.resourceType === ResourceType.Organization) {
      return this.organizationValidators.uniqueCode();
    } else if (this.resourceType === ResourceType.Project) {
      return this.projectValidators.uniqueCode();
    }

    return null;
  }

  private createResourceAction(): Action {
    const resource = this.createResourceObject();

    if (this.resourceType === ResourceType.Organization) {
      return new OrganizationsAction.Create({organization: resource, callback: this.dialogService.callback});
    } else if (this.resourceType === ResourceType.Project) {
      const project = {...resource, organizationId: this.parentId};
      return new ProjectsAction.Create({project, callback: this.dialogService.callback});
    }

    return null;
  }

  private createResourceObject(): ResourceModel {
    return {
      name: this.nameInput.value,
      code: this.codeInput.value,
      color: this.color,
      icon: this.icon,
      description: '',
    };
  }

  private parseResourceType() {
    this.resourceType = this.getResourceTypeFromRouter();

    this.route.paramMap
      .pipe(
        map(params => params.get('organizationId')),
        take(1)
      )
      .subscribe(parentId => {
        this.parentId = parentId;
        if (this.resourceType === ResourceType.Project && parentId) {
          this.projectValidators.setOrganizationId(parentId);
          this.selectData();
        }

        this.codeInput.setAsyncValidators(this.createAsyncValidator());
      });
  }

  private selectData() {
    this.subscriptions.add(
      this.store
        .select(selectOrganizationById(this.parentId))
        .subscribe(resource => (this.parentOrganization = resource))
    );
    this.subscriptions.add(
      this.store
        .select(selectProjectsByOrganizationId(this.parentId))
        .subscribe(projects => (this.isFirstProject = projects.length === 0))
    );
  }

  private getResourceTypeFromRouter(): ResourceType {
    const [rootPath] = this.route.routeConfig.path.split('/');
    const dialogPath = dialogPathsMap[rootPath];
    if (dialogPath === DialogPath.CREATE_ORGANIZATION) {
      return ResourceType.Organization;
    } else if (dialogPath === DialogPath.CREATE_PROJECT) {
      return ResourceType.Project;
    }
    return null;
  }
}
