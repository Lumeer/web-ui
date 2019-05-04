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

import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {Action, select, Store} from '@ngrx/store';
import {map, mergeMap} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {DialogService} from '../dialog.service';
import {ResourceType} from '../../core/model/resource-type';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {Observable, of} from 'rxjs';
import {DialogPath, dialogPathsMap} from '../dialog-path';
import {CreateResourceDialogFormComponent} from './form/create-resource-dialog-form.component';
import {Organization} from '../../core/store/organizations/organization';
import {Project} from '../../core/store/projects/project';
import {selectOrganizationById} from '../../core/store/organizations/organizations.state';
import {TemplateType, templateTypesMap} from '../../core/model/template';

@Component({
  selector: 'create-resource-dialog',
  templateUrl: './create-resource-dialog.component.html',
  styleUrls: ['./create-resource-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateResourceDialogComponent implements OnInit {
  @ViewChild(CreateResourceDialogFormComponent)
  public resourceFormComponent: CreateResourceDialogFormComponent;

  public parentId$: Observable<string>;
  public initialTemplate$: Observable<TemplateType>;
  public contentValid$: Observable<boolean>;

  public resourceType: ResourceType;

  constructor(private dialogService: DialogService, private route: ActivatedRoute, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.parseResourceType();
  }

  public onSubmit() {
    this.resourceFormComponent.onSubmit();
  }

  public submitResource(data: {resource: Organization | Project; template?: TemplateType}) {
    const callback = this.dialogService.callback;
    const {resource, template} = data;

    const action = this.createResourceAction(resource, template);
    if (action) {
      this.store$.dispatch(action);
    }

    if (!callback) {
      this.dialogService.closeDialog();
    }
  }

  private createResourceAction(resource: Organization | Project, template?: TemplateType): Action {
    if (this.resourceType === ResourceType.Organization) {
      return new OrganizationsAction.Create({organization: resource, callback: this.dialogService.callback});
    } else if (this.resourceType === ResourceType.Project) {
      const notEmptyTemplate = template !== TemplateType.Empty ? template : null;
      return new ProjectsAction.Create({
        project: resource,
        template: notEmptyTemplate,
        callback: this.dialogService.callback,
      });
    }

    return null;
  }

  private parseResourceType() {
    this.resourceType = this.getResourceTypeFromRouter();

    this.parentId$ = this.route.paramMap.pipe(map(params => params.get('organizationId')));
    this.initialTemplate$ = this.route.paramMap.pipe(
      map(params => params.get('templateId')),
      map(templateId => templateId && templateTypesMap[templateId.toUpperCase()])
    );

    if (this.resourceType === ResourceType.Project) {
      this.contentValid$ = this.parentId$.pipe(
        mergeMap(parentId => this.store$.pipe(select(selectOrganizationById(parentId)))),
        map(organization => !!organization)
      );
    } else {
      this.contentValid$ = of(true);
    }
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
