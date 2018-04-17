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

import {NgModule} from '@angular/core';

import {ClickOutsideModule} from 'ng-click-outside';
import {WorkspaceChooserComponent} from './workspace-chooser/workspace-chooser.component';
import {WorkspaceRoutingModule} from './workspace-routing.module';
import {SharedModule} from '../shared/shared.module';
import {OrganizationPermissionsComponent} from './organization/permissions/organization-permissions.component';
import {ProjectPermissionsComponent} from './project/permissions/project-permissions.component';
import {OrganizationSettingsComponent} from './organization/organization-settings.component';
import {ProjectSettingsComponent} from './project/project-settings.component';
import {ResourceChooserComponent} from './workspace-chooser/resource-chooser/resource-chooser.component';
import {PickerModule} from '../shared/picker/picker.module';
import {WorkspaceSelectGuard} from './workspace-select.guard';
import {WorkspaceService} from './workspace.service';
import {OrganizationUsersComponent} from './organization/users/organization-users.component';
import {OrganizationGroupsComponent} from './organization/groups/organization-groups.component';
import {OrganizationRegistrationComponent} from './organization/registration/organization-registration.component';
import {OrganizationSettingsGuard} from "./organization/organization-settings.guard";
import {OrganizationUserListComponent} from './organization/users/list/organization-user-list.component';
import {OrganizationUserComponent} from './organization/users/user/organization-user.component';
import {OrganizationUserGroupsComponent} from './organization/users/groups/organization-user-groups.component';
import {OrganizationNewUserComponent} from './organization/users/new-user/organization-new-user.component';
import {GroupsSuggestionsComponent} from "./organization/users/groups/suggestions/groups-suggestions.component";
import {OrganizationDetailComponent} from "./organization/detail/organization-detail.component";
import { ContactFormComponent } from './organization/detail/contact-form/contact-form/contact-form.component';
import { PaymentsPanelComponent } from './organization/detail/payments-panel/payments-panel.component';
import { PaymentsOrderComponent } from './organization/detail/payments-panel/payments-order/payments-order.component';
import { PaymentsListComponent } from './organization/detail/payments-panel/payments-list/payments-list.component';

@NgModule({
  imports: [
    SharedModule,
    WorkspaceRoutingModule,
    PickerModule,
    ClickOutsideModule
  ],
  declarations: [
    OrganizationDetailComponent,
    OrganizationPermissionsComponent,
    OrganizationUsersComponent,
    OrganizationUserListComponent,
    OrganizationUserGroupsComponent,
    OrganizationUserComponent,
    OrganizationNewUserComponent,
    OrganizationGroupsComponent,
    OrganizationRegistrationComponent,
    ProjectPermissionsComponent,
    OrganizationSettingsComponent,
    ProjectSettingsComponent,
    WorkspaceChooserComponent,
    ResourceChooserComponent,
    GroupsSuggestionsComponent,
    ContactFormComponent,
    PaymentsPanelComponent,
    PaymentsOrderComponent,
    PaymentsListComponent
  ],
  exports: [
    WorkspaceChooserComponent
  ],
  providers: [
    WorkspaceService,
    WorkspaceSelectGuard,
    OrganizationSettingsGuard
  ]
})
export class WorkspaceModule {

}
