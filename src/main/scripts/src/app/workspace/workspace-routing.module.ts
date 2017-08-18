/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {WorkspaceChooserComponent} from './workspace-chooser/workspace-chooser.component';
import {OrganizationFormComponent} from './organization/form/organization-form.component';
import {ProjectFormComponent} from './project/form/project-form.component';
import {OrganizationSettingsComponent} from './organization/organization-settings.component';
import {ProjectSettingsComponent} from './project/project-settings.component';
import {ProjectPermissionsComponent} from './project/permissions/project-permissions.component';
import {OrganizationPermissionsComponent} from './organization/permissions/organization-permissions.component';

const workspaceRoutes: Routes = [
  {
    path: 'organization/:organizationCode/project/add',
    component: ProjectFormComponent
  },
  {
    path: 'organization/:organizationCode/project/:projectCode',
    component: ProjectSettingsComponent,
    children: [
      {
        path: 'settings',
        component: ProjectFormComponent
      },
      {
        path: 'permissions',
        component: ProjectPermissionsComponent
      },
      {
        path: '',
        redirectTo: 'settings',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'organization/add',
    component: OrganizationFormComponent
  },
  {
    path: 'organization/:organizationCode',
    component: OrganizationSettingsComponent,
    children: [
      {
        path: 'settings',
        component: OrganizationFormComponent
      },
      {
        path: 'permissions',
        component: OrganizationPermissionsComponent
      },
      {
        path: '',
        redirectTo: 'settings',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'workspace',
    component: WorkspaceChooserComponent
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(workspaceRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class WorkspaceRoutingModule {

}
