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

import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';

import {WorkspaceChooserComponent} from './settings/workspace-chooser/workspace-chooser.component';
import {OrganizationComponent} from './settings/organization/organization.component';
import {ProjectComponent} from './settings/project/project.component';

const routes: Routes = [
  {path: '', redirectTo: '/workspace', pathMatch: 'full'},
  {path: 'workspace', component: WorkspaceChooserComponent},
  {path: 'organization', component: OrganizationComponent},
  {path: 'organization/:code', component: OrganizationComponent},
  {path: 'organization/:orgCode/project', component: ProjectComponent},
  {path: 'organization/:orgCode/project/:projCode', component: ProjectComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
