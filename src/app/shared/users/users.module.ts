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

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';

import {UserListComponent} from './user-list/user-list.component';
import {UserComponent} from './user-list/user/user.component';
import {NewUserComponent} from './new-user/new-user.component';
import {UsersComponent} from './users.component';
import {TagModule} from '../tag/tag.module';
import {InputModule} from '../input/input.module';
import {UserFilterPipe} from './pipes/user-filter.pipe';
import {PipesModule} from '../pipes/pipes.module';
import {UserStampComponent} from './user-stamp/user-stamp.component';
import {GravatarModule} from 'ngx-gravatar';
import {RolesModule} from '../roles/roles.module';
import {UserRolesPipe} from './pipes/user-roles.pipe';
import {UserTeamsComponent} from './user-list/user/teams/user-teams.component';
import {DropdownModule} from '../dropdown/dropdown.module';
import {TeamsIdsPipe} from './pipes/teams-ids.pipe';
import {FilterTeamsPipe} from './pipes/filter-teams.pipe';
import {FilterUserTeamsPipe} from './pipes/filter-user-teams.pipe';
import {UserTableComponent} from './user-list/table/user-table.component';
import {UserTransitiveRolesPipe} from './pipes/user-transitive-roles.pipe';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {RouterModule} from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    TagModule,
    InputModule,
    PipesModule,
    GravatarModule,
    RolesModule,
    DropdownModule,
    TooltipModule,
    RouterModule,
  ],
  declarations: [
    UserFilterPipe,
    UserListComponent,
    UserComponent,
    NewUserComponent,
    UsersComponent,
    UserStampComponent,
    UserRolesPipe,
    UserTeamsComponent,
    TeamsIdsPipe,
    FilterTeamsPipe,
    FilterUserTeamsPipe,
    UserTableComponent,
    UserTransitiveRolesPipe,
  ],
  exports: [
    UsersComponent,
    NewUserComponent,
    UserStampComponent,
    UserTableComponent,
    UserTeamsComponent,
    FilterUserTeamsPipe,
  ],
})
export class UsersModule {}
