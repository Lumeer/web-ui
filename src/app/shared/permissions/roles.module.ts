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
import {CommonModule} from '@angular/common';
import {RolesComponent} from './roles.component';
import {RolesDropdownComponent} from './dropdown/roles-dropdown.component';
import {DropdownModule} from '../dropdown/dropdown.module';
import {AccordionModule} from 'ngx-bootstrap/accordion';
import { RoleComponent } from './dropdown/role/role.component';
import { RoleGroupComponent } from './dropdown/role-group/role-group.component';
import { IsRoleSelectedPipe } from './pipes/is-role-selected.pipe';
import { IsRoleGroupSelectedPipe } from './pipes/is-role-group-selected.pipe';


@NgModule({
  declarations: [RolesComponent, RolesDropdownComponent, RoleComponent, RoleGroupComponent, IsRoleSelectedPipe, IsRoleGroupSelectedPipe],
  imports: [
    CommonModule,
    DropdownModule,
    AccordionModule
  ],
  exports: [RolesComponent, RolesDropdownComponent]
})
export class RolesModule {
}
