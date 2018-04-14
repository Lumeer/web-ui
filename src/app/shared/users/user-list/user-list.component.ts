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

import {Attribute, Component, EventEmitter, Input, Output} from '@angular/core';

import {UserModel} from '../../../core/store/users/user.model';
import {filterUsersByFilter} from "../../../core/store/users/user.filters";
import {ResourceType} from '../../../core/model/resource-type';
import {PermissionModel, PermissionsModel} from '../../../core/store/permissions/permissions.model';

@Component({
  selector: 'user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent {

  @Input() public resourceType: ResourceType;

  @Input() public users: UserModel[];

  @Input() public permissions: PermissionsModel;

  @Output() public userCreated = new EventEmitter<string>();

  @Output() public userUpdated = new EventEmitter<UserModel>();

  @Output() public userDeleted = new EventEmitter<UserModel>();

  @Output() public userPermissionChange = new EventEmitter<{ newPermission: PermissionModel, currentPermission: PermissionModel }>();

  public expanded: { [email: string]: boolean } = {};
  public userFilter: string;

  public onFilterChanged(filter: string) {
    this.userFilter = filter;
  }

  public filterUsers(users: UserModel[]): UserModel[] {
    return filterUsersByFilter(users, this.userFilter);
  }

  public canEditUsers(): boolean {
    return this.resourceType === ResourceType.Organization;
  }

  public getUserPermission(userId: string): PermissionModel {
    return this.permissions && this.permissions.users && this.permissions.users.find(perm => perm.id === userId);
  }

  public getUserRoles(userId: string): string[] {
    const userPermission = this.getUserPermission(userId);
    return userPermission && userPermission.roles || [];
  }

  public onUserRolesChanged(userId: string, roles: string[]) {
    const currentPermission = this.getUserPermission(userId);
    const newPermission = {id: userId, roles};
    this.userPermissionChange.emit({newPermission, currentPermission});
  }
}
