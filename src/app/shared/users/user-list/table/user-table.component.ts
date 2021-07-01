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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {User} from '../../../../core/store/users/user';
import {Team} from '../../../../core/store/teams/team';
import {Permissions, Role} from '../../../../core/store/permissions/permissions';
import {ResourceType} from '../../../../core/model/resource-type';
import {Organization} from '../../../../core/store/organizations/organization';
import {Project} from '../../../../core/store/projects/project';

@Component({
  selector: 'user-table',
  templateUrl: './user-table.component.html',
  styleUrls: ['./user-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserTableComponent {
  @Input()
  public users: User[];

  @Input()
  public teams: Team[];

  @Input()
  public permissions: Permissions;

  @Input()
  public color: string;

  @Input()
  public resourceType: ResourceType;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public deletableUserIds: string[];

  @Input()
  public removableUserIds: string[];

  @Input()
  public editableUserIds: string[];

  @Input()
  public editableGroups: boolean;

  @Output()
  public userUpdated = new EventEmitter<User>();

  @Output()
  public userRemoved = new EventEmitter<User>();

  @Output()
  public userDeleted = new EventEmitter<User>();

  @Output()
  public userRolesChange = new EventEmitter<{user: User; roles: Role[]}>();

  @Output()
  public userTeamsChange = new EventEmitter<{user: User; teams: string[]}>();

  public searchString: string;

  public trackByUserId(index: number, user: User): string {
    return user.id || user.correlationId;
  }
}
