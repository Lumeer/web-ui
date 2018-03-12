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
import {OrganizationUsersHeaderComponent} from './organization/users/header/organization-users-header.component';
import {OrganizationUserGroupsComponent} from './organization/users/groups/organization-user-groups.component';
import {OrganizationNewUserComponent} from './organization/users/new-user/organization-new-user.component';
import {GroupsSuggestionsComponent} from "./organization/users/groups/suggestions/groups-suggestions.component";

@NgModule({
  imports: [
    SharedModule,
    WorkspaceRoutingModule,
    PickerModule,
    ClickOutsideModule
  ],
  declarations: [
    OrganizationPermissionsComponent,
    OrganizationUsersComponent,
    OrganizationUserListComponent,
    OrganizationUserGroupsComponent,
    OrganizationUserComponent,
    OrganizationNewUserComponent,
    OrganizationUsersHeaderComponent,
    OrganizationGroupsComponent,
    OrganizationRegistrationComponent,
    ProjectPermissionsComponent,
    OrganizationSettingsComponent,
    ProjectSettingsComponent,
    WorkspaceChooserComponent,
    ResourceChooserComponent,
    GroupsSuggestionsComponent
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
