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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {User} from '../../../core/store/users/user';
import {ResourceType} from '../../../core/model/resource-type';
import {Permission} from '../../../core/store/permissions/permissions';
import {Resource} from '../../../core/model/resource';
import {Project} from '../../../core/store/projects/project';
import {Organization} from '../../../core/store/organizations/organization';

@Component({
  selector: 'user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  @Input() public resourceType: ResourceType;

  @Input() public users: User[];

  @Input() public currentUser: User;

  @Input() public resource: Resource;

  @Input() public organization: Organization;

  @Input() public project: Project;

  @Output() public userCreated = new EventEmitter<string>();

  @Output() public userUpdated = new EventEmitter<User>();

  @Output() public userDeleted = new EventEmitter<User>();

  @Output()
  public userPermissionChange = new EventEmitter<{
    newPermission: Permission;
    currentPermission: Permission;
    onlyStore: boolean;
  }>();

  public searchString: string;

  private getUserPermission(userId: string): Permission {
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

  public trackByUserId(index: number, user: User): string {
    return user.id;
  }
}
