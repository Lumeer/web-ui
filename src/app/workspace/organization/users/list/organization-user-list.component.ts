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

import {Component, EventEmitter, Input, Output} from '@angular/core';

import {OrganizationModel} from '../../../../core/store/organizations/organization.model';
import {UserModel} from '../../../../core/store/users/user.model';
import {GroupModel} from '../../../../core/store/groups/group.model';
import {UserFilters} from "../../../../core/store/users/user.filters";

@Component({
  selector: 'organization-user-list',
  templateUrl: './organization-user-list.component.html',
  styleUrls: ['./organization-user-list.component.scss']
})
export class OrganizationUserListComponent {

  @Input()
  public organization: OrganizationModel;

  @Input()
  public users: UserModel[];

  @Input()
  public groups: GroupModel[];

  @Output()
  public userCreated = new EventEmitter<UserModel>();

  @Output()
  public userUpdated = new EventEmitter<UserModel>();

  @Output()
  public userDeleted = new EventEmitter<UserModel>();

  public expanded: { [email: string]: boolean } = {};
  public userFilter: string;

  public onFilterChanged(filter: string) {
    this.userFilter = filter;
  }

  public filterUsers(users: UserModel[]): UserModel[] {
    return UserFilters.filterByFilter(users, this.userFilter);
  }

}
