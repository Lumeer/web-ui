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
import {DatePipe} from '@angular/common';

import {ClickOutsideModule} from 'ng-click-outside';
import {WorkspaceRoutingModule} from './workspace-routing.module';
import {SharedModule} from '../shared/shared.module';
import {ProjectUsersComponent} from './project/users/project-users.component';
import {OrganizationSettingsComponent} from './organization/organization-settings.component';
import {ProjectSettingsComponent} from './project/project-settings.component';
import {WorkspaceService} from './workspace.service';
import {OrganizationRegistrationComponent} from './organization/registration/organization-registration.component';
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
import {OrganizationGroupsComponent} from './organization/groups/organization-groups.component';
import {ProjectSequencesComponent} from './project/project-sequences/project-sequences.component';

@NgModule({
  imports: [SharedModule, WorkspaceRoutingModule, UsersModule, ClickOutsideModule],
  declarations: [
    OrganizationDetailComponent,
    ProjectUsersComponent,
    OrganizationUsersComponent,
    OrganizationGroupsComponent,
    OrganizationRegistrationComponent,
    OrganizationGroupsComponent,
    OrganizationSettingsComponent,
    ProjectSettingsComponent,
    ContactFormComponent,
    PaymentsPanelComponent,
    PaymentsOrderComponent,
    PaymentsListComponent,
    PaymentsStateComponent,
    ProjectSequencesComponent,
  ],
  exports: [],
  providers: [WorkspaceService, OrganizationSettingsGuard, ProjectSettingsGuard, DatePipe],
})
export class WorkspaceModule {}
