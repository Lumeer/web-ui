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
import {Role} from '../../../../shared/permissions/role';
import {PermissionModel} from '../../../../core/store/permissions/permissions.model';

@Component({
  selector: 'organization-user',
  templateUrl: './organization-user.component.html',
  styleUrls: ['./organization-user.component.scss']
})
export class OrganizationUserComponent {

  @Input()
  public organization: OrganizationModel;

  @Input()
  public user: UserModel;

  @Input()
  public expanded: boolean;

  @Output()
  public expandedChange = new EventEmitter();

  @Output()
  public userUpdated = new EventEmitter<UserModel>();

  @Output()
  public userDeleted = new EventEmitter<UserModel>();

  @Output()
  public permissionsUpdated = new EventEmitter<OrganizationModel>();

  public blocked: boolean;

  public updateUserName(newName: string) {
    this.userUpdated.emit({...this.user, name: newName});
  }

  public hasWritePermission(): boolean {
    return this.hasPermission(Role.Write);
  }

  public hasManagePermission(): boolean {
    return this.hasPermission(Role.Manage);
  }

  private hasPermission(role: Role): boolean {
    const permissions = this.userPermissions();
    return permissions.roles.includes(role);
  }

  private userPermissions(): PermissionModel {
    let permissions = this.organization.permissions.users.find(userPermissions => {
      return userPermissions.id === this.user.email;
    });

    if (permissions === undefined) {
      permissions = this.addUserPermissions();
    }

    return permissions;
  }

  private addUserPermissions(): PermissionModel {
    const createdPermissions: PermissionModel = {
      id: this.user.email,
      roles: []
    };

    this.organization.permissions.users.push(createdPermissions);
    return createdPermissions;
  }

  public changeWritePermission() {
    this.changePermission(Role.Write);
  }

  public changeManagePermission() {
    this.changePermission(Role.Manage);
  }

  private changePermission(changedRole: Role) {
    if (this.hasPermission(changedRole)) {
      this.removePermission(changedRole);
    } else {
      this.addPermission(changedRole);
    }
  }

  private addPermission(addedRole: Role) {
    const permissions = this.userPermissions();
    permissions.roles.push(addedRole);

    this.permissionsUpdated.emit(this.organization);
  }

  private removePermission(removedRole: Role) {
    const permissions = this.userPermissions();
    permissions.roles = permissions.roles.filter(role => role !== removedRole);

    this.permissionsUpdated.emit(this.organization);
  }

  public blockUser() {
    this.blocked = !this.blocked;
  }

  public removeUser() {
    this.userDeleted.emit(this.user);
  }

}
