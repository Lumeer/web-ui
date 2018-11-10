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

import {UserModel} from '../../../core/store/users/user.model';
import {filterUsersByFilter} from '../../../core/store/users/user.filters';
import {ResourceType} from '../../../core/model/resource-type';
import {PermissionModel, PermissionsModel} from '../../../core/store/permissions/permissions.model';
import {ResourceModel} from '../../../core/model/resource.model';
import {isNullOrUndefined} from 'util';
import {HtmlModifier} from '../../utils/html-modifier';
import {AttributeModel} from '../../../core/store/collections/collection.model';

@Component({
  selector: 'user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent {
  @Input() public resourceType: ResourceType;

  @Input() public users: UserModel[];

  @Input() public currentUser: UserModel;

  @Input() public resource: ResourceModel;

  @Output() public userCreated = new EventEmitter<string>();

  @Output() public userUpdated = new EventEmitter<UserModel>();

  @Output() public userDeleted = new EventEmitter<UserModel>();

  @Output()
  public userPermissionChange = new EventEmitter<{
    newPermission: PermissionModel;
    currentPermission: PermissionModel;
    onlyStore: boolean;
  }>();

  public expanded: {[email: string]: boolean} = {};
  public searchString: string;

  public canAddUsers(): boolean {
    return this.resourceType === ResourceType.Organization;
  }

  public canEditUser(userId: string): boolean {
    return this.resourceType === ResourceType.Organization && !this.isCurrentUser(userId);
  }

  public canChangeRoles(userId: string): boolean {
    return !this.isCurrentUser(userId);
  }

  private isCurrentUser(userId: string): boolean {
    return userId === this.getCurrentUserId();
  }

  private getCurrentUserId(): string {
    return (this.currentUser && this.currentUser.id) || '';
  }

  private getUserPermission(userId: string): PermissionModel {
    return (
      this.resource &&
      this.resource.permissions &&
      this.resource.permissions.users &&
      this.resource.permissions.users.find(perm => perm.id === userId)
    );
  }

  public onUserRolesChanged(userId: string, data: {roles: string[]; onlyStore: boolean}) {
    const currentPermission = this.getUserPermission(userId);
    const newPermission = {id: userId, roles: data.roles};
    this.userPermissionChange.emit({newPermission, currentPermission, onlyStore: data.onlyStore});
  }

  public trackByUserId(index: number, user: UserModel): string {
    return user.id;
  }
}
