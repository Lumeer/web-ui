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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';

import {User} from '../../../core/store/users/user';
import {ResourceType} from '../../../core/model/resource-type';
import {Permission, Role} from '../../../core/store/permissions/permissions';
import {Resource} from '../../../core/model/resource';
import {Project} from '../../../core/store/projects/project';
import {Organization} from '../../../core/store/organizations/organization';
import {AppState} from '../../../core/store/app.state';
import {Store} from '@ngrx/store';

@Component({
  selector: 'user-list',
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListComponent {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public users: User[];

  @Input()
  public currentUser: User;

  @Input()
  public resource: Resource;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Output()
  public userCreated = new EventEmitter<string>();

  @Output()
  public userUpdated = new EventEmitter<User>();

  @Output()
  public userDeleted = new EventEmitter<User>();

  @Output()
  public userRolesChange = new EventEmitter<{user: User; roles: Role[]}>();

  public searchString: string;

  constructor(private store$: Store<AppState>) {}

  public onUserRolesChanged(user: User, roles: Role[]) {
    this.userRolesChange.emit({user, roles});
  }

  public trackByUserId(index: number, user: User): string {
    return user.id;
  }
}
