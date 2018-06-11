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

import {Component, OnInit} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';

import {ActivatedRoute} from '@angular/router';
import {Action, Store} from '@ngrx/store';
import {filter, first, map} from 'rxjs/operators';
import {DEFAULT_COLOR, DEFAULT_ICON} from '../../core/constants';
import {AppState} from '../../core/store/app.state';
import {DialogService} from '../dialog.service';
import {ResourceType, resourceTypeFromString} from '../../core/model/resource-type';
import {ResourceModel} from '../../core/model/resource.model';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {ProjectsAction} from '../../core/store/projects/projects.action';

@Component({
  selector: 'create-resource-dialog',
  templateUrl: './create-resource-dialog.component.html'
})
export class CreateResourceDialogComponent implements OnInit {

  public form: FormGroup;

  public color: string = DEFAULT_COLOR;
  public icon: string = DEFAULT_ICON;

  public resourceType: ResourceType;

  constructor(
    private dialogService: DialogService,
    private route: ActivatedRoute,
    private store: Store<AppState>) {
    this.createForm();
  }

  public get codeInput(): AbstractControl {
    return this.form.get('code');
  }

  public get nameInput(): AbstractControl {
    return this.form.get('name');
  }

  private createForm() {
    this.form = new FormGroup({
      icon: new FormControl(this.icon, Validators.required),
      color: new FormControl(this.color, Validators.required),
      code: new FormControl('', [Validators.required, Validators.minLength(3), Validators.maxLength(5)]),
      name: new FormControl('', Validators.required)
    });
    console.log(this.form, this.icon, this.color);
  }

  public ngOnInit() {
    this.reset();
    this.parseResourceType();
  }

  private parseResourceType() {
    this.route.paramMap.pipe(
      map(params => params.get('resourceType')),
      map(resourceType => resourceTypeFromString(resourceType)),
      filter(resourceType => !!resourceType),
      first()
    ).subscribe(resourceType => this.resourceType = resourceType);
  }

  public reset() {
    this.color = DEFAULT_COLOR;
    this.icon = DEFAULT_ICON;
    this.form.reset();
    console.log(this.form, this.icon, this.color);
  }

  public onCodeInput(){
    console.log(this.form, this.icon, this.color);
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

  private createResourceAction(): Action {
    const resource = this.createResourceObject();

    if (this.resourceType === ResourceType.Organization) {
      return new OrganizationsAction.Create({organization: resource, callback: this.dialogService.callback});
    } else if (this.resourceType === ResourceType.Project) {
      return new ProjectsAction.Create({project: resource, callback: this.dialogService.callback});
    }

    return null;
  }

  private createResourceObject(): ResourceModel {
    return {
      name: this.nameInput.value,
      code: this.codeInput.value,
      color: this.color,
      icon: this.icon,
      description: ''
    };
  }

}
