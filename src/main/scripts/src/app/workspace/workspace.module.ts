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

import {PerfectScrollbarModule} from 'ngx-perfect-scrollbar';
import {WorkspaceChooserComponent} from './workspace-chooser/workspace-chooser.component';
import {OrganizationEditComponent} from './organization-edit/organization-edit.component';
import {ProjectEditComponent} from './project-edit/project-edit.component';
import {WorkspaceRoutingModule} from './workspace-routing.module';
import {SharedModule} from '../shared/shared.module';

@NgModule({
  imports: [
    PerfectScrollbarModule,
    SharedModule,
    WorkspaceRoutingModule
  ],
  declarations: [
    OrganizationEditComponent,
    ProjectEditComponent,
    WorkspaceChooserComponent
  ],
  exports: [
    OrganizationEditComponent,
    ProjectEditComponent,
    WorkspaceChooserComponent
  ]
})
export class WorkspaceModule {

}
