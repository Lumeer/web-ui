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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
} from '@angular/core';
import {User} from '../../../../../core/store/users/user';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Project} from '../../../../../core/store/projects/project';
import {View} from '../../../../../core/store/views/view';
import {Permission, Permissions, Role} from '../../../../../core/store/permissions/permissions';
import {BehaviorSubject, Subscription} from 'rxjs';
import {
  teamCanReadWorkspace,
  userCanReadWorkspace,
  userRoleTypesInPermissions,
  userRoleTypesInResource,
} from '../../../../utils/permission.utils';
import {Team} from '../../../../../core/store/teams/team';
import {deepObjectsEquals} from '../../../../utils/common.utils';
import {AttributesResourceType} from '../../../../../core/model/resource';
import {ResourcePermissionType} from '../../../../../core/model/resource-permission-type';

export enum ViewTab {
  Users = 'users',
  Teams = 'teams',
}

@Component({
  selector: 'view-resource-permissions-body',
  templateUrl: './view-resource-permissions-body.component.html',
  styleUrls: ['./view-resource-permissions-body.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewResourcePermissionsBodyComponent implements OnChanges, OnDestroy {
  @Input()
  public resourceType: AttributesResourceType;

  @Input()
  public currentUser: User;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public view: View;

  @Input()
  public users: User[];

  @Input()
  public teams: Team[];

  @Input()
  public permissions: Permissions;

  @Output()
  public submitPermissions = new EventEmitter<Permissions>();

  public userRoles$ = new BehaviorSubject<Record<string, Role[]>>({});
  public teamRoles$ = new BehaviorSubject<Record<string, Role[]>>({});

  public usersWithReadPermission: User[];
  public teamsWithReadPermission: Team[];
  public resourcePermissionType: ResourcePermissionType;

  public staticUsers$ = new BehaviorSubject<User[]>([]);
  public changeableUsers$ = new BehaviorSubject<User[]>([]);

  public selectedTab$ = new BehaviorSubject<ViewTab>(ViewTab.Users);

  public readonly viewTab = ViewTab;

  private subscriptions = new Subscription();

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.users || changes.teams || changes.organization || changes.project || changes.currentUser) {
      this.initUsersAndTeams();
    }
    if (changes.resourceType) {
      this.resourcePermissionType =
        this.resourceType === AttributesResourceType.Collection
          ? ResourcePermissionType.ViewCollection
          : ResourcePermissionType.ViewLinkType;
    }
  }

  private initUsersAndTeams() {
    this.usersWithReadPermission =
      this.users?.filter(user => userCanReadWorkspace(this.organization, this.project, user)) || [];
    this.teamsWithReadPermission =
      this.teams?.filter(team => teamCanReadWorkspace(this.organization, this.project, team)) || [];

    this.initUsers();
    this.initTeams();
  }

  private addUser(user: User) {
    this.userRoles$.next({...this.userRoles$.getValue(), [user.id]: []});
    this.changeableUsers$.next([...this.changeableUsers$.getValue(), user]);
  }

  public deleteUser(user: User) {
    const userRoles = {...this.userRoles$.value};
    if (user.id) {
      delete userRoles[user.id];
      this.changeableUsers$.next(this.changeableUsers$.value.filter(u => u.id !== user.id));
    }

    this.userRoles$.next(userRoles);
  }

  public onNewRoles(user: User, roles: Role[]) {
    this.userRoles$.next({...this.userRoles$.value, [user.id]: roles});
  }

  public onNewTeamRoles(team: Team, roles: Role[]) {
    this.teamRoles$.next({...this.teamRoles$.value, [team.id]: roles});
  }

  public onUserSelected(user: User) {
    this.addUser(user);
  }

  private initUsers() {
    const userRoles = {...this.userRoles$.value};
    for (const user of this.users || []) {
      // user has rights in view or is current user
      if (
        userRoleTypesInResource(this.organization, this.project, this.view, user).length > 0 ||
        user.id === this.currentUser.id
      ) {
        this.addUserToStaticIfNotPresented(user, userRoles);
      } else if (userRoleTypesInPermissions(this.organization, this.project, this.permissions, user).length > 0) {
        this.addUserToChangeableIfNotPresented(user, userRoles);
      }
    }
    this.checkRemovedUsers();

    if (!deepObjectsEquals(userRoles, this.userRoles$.value)) {
      this.userRoles$.next(userRoles);
    }
  }

  private addUserToStaticIfNotPresented(user: User, rolesMap: Record<string, Role[]>) {
    if (!this.isUserPresented(user)) {
      this.staticUsers$.next([...this.staticUsers$.value, user]);
      rolesMap[user.id] = this.getUserPermissions(user)?.roles || [];
    }
  }

  private addUserToChangeableIfNotPresented(user: User, rolesMap: Record<string, Role[]>) {
    if (!this.isUserPresented(user)) {
      this.changeableUsers$.next([...this.changeableUsers$.value, user]);
      rolesMap[user.id] = this.getUserPermissions(user)?.roles || [];
    }
  }

  private isUserPresented(user: User): boolean {
    return (
      !!this.changeableUsers$.value.find(u => u.id === user.id) || !!this.staticUsers$.value.find(u => u.id === user.id)
    );
  }

  private getUserPermissions(user: User): Permission {
    return this.permissions?.users?.find(permission => permission.id === user.id);
  }

  private checkRemovedUsers() {
    const userIds = this.users.map(user => user.id);
    this.staticUsers$.next(this.staticUsers$.value.filter(user => userIds.includes(user.id)));
    this.changeableUsers$.next(this.changeableUsers$.value.filter(user => userIds.includes(user.id)));
  }

  private initTeams() {
    const teamRoles = {...this.teamRoles$.value};
    let rolesChanged = false;
    for (const team of this.teams || []) {
      if (!teamRoles[team.id]) {
        teamRoles[team.id] = this.getTeamPermissions(team)?.roles || [];
        rolesChanged = true;
      }
    }
    if (rolesChanged) {
      this.teamRoles$.next(teamRoles);
    }
  }

  private getTeamPermissions(team: Team): Permission {
    return this.permissions?.groups?.find(permission => permission.id === team.id);
  }

  public onSubmit() {
    const userRoles = this.userRoles$.value;
    const allUsersIds = [...this.changeableUsers$.value.map(u => u.id), ...this.staticUsers$.value.map(u => u.id)];

    const userPermissions: Permission[] = Object.keys(userRoles)
      .filter(id => allUsersIds.includes(id))
      .map(id => ({id, roles: userRoles[id]}));

    const teamRoles = this.teamRoles$.value;
    const allTeamIds = this.teams.map(team => team.id);

    const teamPermissions: Permission[] = Object.keys(teamRoles)
      .filter(id => allTeamIds.includes(id))
      .map(id => ({id, roles: teamRoles[id]}));

    const permissions: Permissions = {users: userPermissions, groups: teamPermissions};
    this.submitPermissions.emit(permissions);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
