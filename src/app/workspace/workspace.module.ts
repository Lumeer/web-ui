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

import {NgModule} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import {WorkspaceRoutingModule} from './workspace-routing.module';
import {ProjectUsersComponent} from './project/users/project-users.component';
import {OrganizationSettingsComponent} from './organization/organization-settings.component';
import {ProjectSettingsComponent} from './project/project-settings.component';
import {WorkspaceService} from './workspace.service';
import {OrganizationSettingsGuard} from './organization/organization-settings.guard';
import {OrganizationDetailComponent} from './organization/detail/organization-detail.component';
import {ContactFormComponent} from './organization/detail/contact-form/contact-form.component';
import {PaymentsPanelComponent} from './organization/detail/payments-panel/payments-panel.component';
import {PaymentsOrderComponent} from './organization/detail/payments-panel/payments-order/payments-order.component';
import {PaymentsListComponent} from './organization/detail/payments-panel/payments-list/payments-list.component';
import {PaymentsStateComponent} from './organization/detail/payments-panel/payments-state/payments-state.component';
import {OrganizationUsersComponent} from './organization/users/organization-users.component';
import {UsersModule} from '../shared/users/users.module';
import {ProjectSettingsGuard} from './project/project-settings.guard';
import {ProjectSequencesComponent} from './project/sequences/project-sequences.component';
import {ProjectTemplateComponent} from './project/template/project-template.component';
import {ProjectTemplateMetadataComponent} from './project/template/metadata/project-template-metadata.component';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {ProjectTemplateScriptComponent} from './project/template/metadata/script/project-template-script.component';
import {DirectivesModule} from '../shared/directives/directives.module';
import {OrganizationTeamsComponent} from './organization/teams/organization-teams.component';
import {TeamsModule} from '../shared/teams/teams.module';
import {ProjectTeamsComponent} from './project/teams/project-teams.component';
import {OrganizationTabGuard} from './organization/organization-tab.guard';
import {ProjectTabGuard} from './project/project-tab.guard';
import {ProjectUploadComponent} from './project/upload/project-upload.component';
import {ProjectSelectionListsComponent} from './project/selection/project-selection-lists.component';
import {SelectionListsModule} from '../shared/lists/selection/selection-lists.module';
import {ProjectVariablesComponent} from './project/variables/project-variables.component';
import {ResourceModuleModule} from '../shared/resource/resource-module.module';
import {SelectModule} from '../shared/select/select.module';
import {PipesModule} from '../shared/pipes/pipes.module';
import {TopPanelModule} from '../shared/top-panel/top-panel.module';
import {SequencesModule} from '../shared/sequences/sequences.module';
import {SliderModule} from '../shared/slider/slider.module';

@NgModule({
  imports: [
    CommonModule,
    ResourceModuleModule,
    WorkspaceRoutingModule,
    UsersModule,
    DirectivesModule,
    BsDatepickerModule,
    TeamsModule,
    SelectionListsModule,
    SelectModule,
    PipesModule,
    ReactiveFormsModule,
    TopPanelModule,
    SequencesModule,
    SliderModule,
    FormsModule,
  ],
  declarations: [
    OrganizationDetailComponent,
    ProjectUsersComponent,
    OrganizationUsersComponent,
    OrganizationSettingsComponent,
    ProjectSettingsComponent,
    ContactFormComponent,
    PaymentsPanelComponent,
    PaymentsOrderComponent,
    PaymentsListComponent,
    PaymentsStateComponent,
    ProjectSequencesComponent,
    ProjectTemplateComponent,
    ProjectTemplateMetadataComponent,
    ProjectTemplateScriptComponent,
    OrganizationTeamsComponent,
    ProjectTeamsComponent,
    ProjectUploadComponent,
    ProjectSelectionListsComponent,
    ProjectVariablesComponent,
  ],
  exports: [],
  providers: [
    WorkspaceService,
    OrganizationSettingsGuard,
    OrganizationTabGuard,
    ProjectSettingsGuard,
    ProjectTabGuard,
    DatePipe,
  ],
})
export class WorkspaceModule {}
