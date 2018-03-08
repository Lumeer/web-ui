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

import {Component, OnInit} from '@angular/core';
import {Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {Observable} from 'rxjs/Observable';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {OrganizationModel} from '../../../core/store/organizations/organization.model';
import {UserModel} from '../../../core/store/users/user.model';
import {selectAllUsers} from '../../../core/store/users/users.state';
import {UsersAction} from '../../../core/store/users/users.action';
import {PermissionModel} from '../../../core/store/permissions/permissions.model';
import {Role} from '../../../shared/permissions/role';
import {OrganizationsAction} from '../../../core/store/organizations/organizations.action';
import {tap} from 'rxjs/operators';
import {GroupModel} from '../../../core/store/groups/group.model';
import {selectAllGroups} from '../../../core/store/groups/groups.state';

@Component({
  templateUrl: './organization-users.component.html',
  styleUrls: ['./organization-users.component.scss']
})
export class OrganizationUsersComponent implements OnInit {

  public organization$: Observable<OrganizationModel>;
  public users$: Observable<UserModel[]>;
  public groups$: Observable<GroupModel[]>;

  public expanded: { [email: string]: boolean } = {};
  public newGroupName: { [email: string]: string } = {};

  constructor(private store: Store<AppState>) {
  }

  public ngOnInit(): void {
    this.organization$ = this.store.select(selectOrganizationByWorkspace);
    this.users$ = this.store.select(selectAllUsers).pipe(tap(this.sortUsers));
    this.groups$ = this.store.select(selectAllGroups);
  }

  private sortUsers(users: UserModel[]): void {
    users.sort((user1, user2) => user1.name.localeCompare(user2.name));
  }

  public hasWritePermission(user: UserModel, organization: OrganizationModel): boolean {
    const permissions = this.userPermissions(user, organization);
    return permissions.roles.includes(Role.Write);
  }

  public hasManagePermission(user: UserModel, organization: OrganizationModel): boolean {
    const permissions = this.userPermissions(user, organization);
    return permissions.roles.includes(Role.Manage);
  }

  private userPermissions(user: UserModel, organization: OrganizationModel): PermissionModel {
    let permissions = organization.permissions.users.find(userPermissions => {
      return userPermissions.id === user.email;
    });

    if (permissions === undefined) {
      permissions = this.addUserPermissions(user, organization);
    }

    return permissions;
  }

  private addUserPermissions(user: UserModel, organization: OrganizationModel): PermissionModel {
    const createdPermissions: PermissionModel = {
      id: user.email,
      roles: []
    };

    organization.permissions.users.push(createdPermissions);
    this.store.dispatch(new OrganizationsAction.Update({organization: organization}));

    return createdPermissions;
  }

  public changeWritePermission(user: UserModel, organization: OrganizationModel): void {
    if (this.hasWritePermission(user, organization)) {
      this.removePermission(user, organization, Role.Write);
    } else {
      this.addPermission(user, organization, Role.Write);
    }

    this.store.dispatch(new OrganizationsAction.Update({organization: organization}));
  }

  public changeManagePermission(user: UserModel, organization: OrganizationModel): void {
    if (this.hasManagePermission(user, organization)) {
      this.removePermission(user, organization, Role.Manage);
    } else {
      this.addPermission(user, organization, Role.Manage);
    }

    this.store.dispatch(new OrganizationsAction.Update({organization: organization}));
  }

  private addPermission(user: UserModel, organization: OrganizationModel, addedRole: Role): void {
    const permissions = this.userPermissions(user, organization);
    permissions.roles.push(addedRole);
  }

  private removePermission(user: UserModel, organization: OrganizationModel, removedRole: Role): void {
    const permissions = this.userPermissions(user, organization);
    permissions.roles = permissions.roles.filter(role => role !== removedRole);
  }

  public addUser(): void {
    const user: UserModel = {
      email: '',
      name: '',
    };

    this.store.dispatch(new UsersAction.Create({user: user}));
  }

  public updateUserName(user: UserModel): void {
    this.store.dispatch(new UsersAction.Update({user: user}));
  }

  public updateUserEmail(user: UserModel): void {
    this.store.dispatch(new UsersAction.Update({user: user}));
  }

  public blockUser(user: UserModel): void {
    user.blocked = !user.blocked;

    this.store.dispatch(new UsersAction.Update({user: user}));
  }

  public removeUser(user: UserModel): void {
    this.store.dispatch(new UsersAction.Delete({userId: user.id}));
  }

  public userGroups(user: UserModel, groups: GroupModel[]): GroupModel[] {
    return groups.filter(group => group.users && group.users.includes(user.email));
  }

}
