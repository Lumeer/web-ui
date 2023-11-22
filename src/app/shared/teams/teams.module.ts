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
import {RouterModule} from '@angular/router';

import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {GravatarModule} from 'ngx-gravatar';

import {BoxModule} from '../box/box.module';
import {DropdownModule} from '../dropdown/dropdown.module';
import {InputModule} from '../input/input.module';
import {PipesModule} from '../pipes/pipes.module';
import {RolesModule} from '../roles/roles.module';
import {NewTeamComponent} from './new-team/new-team.component';
import {ResourceTypePermissionsMapPipe} from './pipes/resource-type-permissions-map.pipe';
import {ResourceTypeRolesMapPipe} from './pipes/resource-type-roles-map.pipe';
import {TeamsPipesModule} from './pipes/teams-pipes.module';
import {TeamTableComponent} from './team-list/table/team-table.component';
import {TeamListComponent} from './team-list/team-list.component';
import {TeamComponent} from './team-list/team/team.component';
import {TeamUsersComponent} from './team-list/team/users/team-users.component';
import {TeamsComponent} from './teams.component';

@NgModule({
  declarations: [
    TeamsComponent,
    NewTeamComponent,
    TeamListComponent,
    TeamComponent,
    TeamUsersComponent,
    TeamTableComponent,
    ResourceTypePermissionsMapPipe,
    ResourceTypeRolesMapPipe,
  ],
  imports: [
    FormsModule,
    CommonModule,
    PipesModule,
    InputModule,
    GravatarModule,
    DropdownModule,
    TeamsPipesModule,
    RolesModule,
    RouterModule,
    TooltipModule,
    BoxModule,
  ],
  exports: [TeamsComponent, TeamTableComponent],
})
export class TeamsModule {}
