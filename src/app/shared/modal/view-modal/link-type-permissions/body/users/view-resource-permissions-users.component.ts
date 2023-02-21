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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';
import {User} from '../../../../../../core/store/users/user';
import {Organization} from '../../../../../../core/store/organizations/organization';
import {View} from '../../../../../../core/store/views/view';
import {Project} from '../../../../../../core/store/projects/project';
import {Team} from '../../../../../../core/store/teams/team';
import {Permissions, Role} from '../../../../../../core/store/permissions/permissions';
import {ResourcePermissionType} from '../../../../../../core/model/resource-permission-type';

@Component({
  selector: 'view-resource-permissions-users',
  templateUrl: './view-resource-permissions-users.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewResourcePermissionsUsersComponent implements OnChanges {
  @Input()
  public viewsMap: Record<ResourcePermissionType, View>;

  @Input()
  public staticUsers: User[];

  @Input()
  public otherUsers: User[];

  @Input()
  public teams: Team[];

  @Input()
  public currentUser: User;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public permissionsMap: Record<ResourcePermissionType, Permissions>;

  @Input()
  public resourcePermissionType: ResourcePermissionType;

  @Input()
  public color: string;

  @Output()
  public userRemoved = new EventEmitter<User>();

  @Output()
  public userRolesChange = new EventEmitter<{user: User; roles: Record<ResourcePermissionType, Role[]>}>();

  public removableUserIds: string[];
  public editableUserIds: string[];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.otherUsers) {
      this.removableUserIds = (this.otherUsers || []).map(user => user.id);
    }
    if (changes.staticUsers || changes.otherUsers || changes.currentUser) {
      this.editableUserIds = [...(this.staticUsers || []), ...(this.otherUsers || [])]
        .filter(user => user.id !== this.currentUser.id)
        .map(user => user.id);
    }
  }
}
