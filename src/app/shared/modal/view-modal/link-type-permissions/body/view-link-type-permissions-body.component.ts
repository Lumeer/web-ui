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
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {BehaviorSubject, Observable, Subscription} from 'rxjs';

import {deepObjectsEquals} from '@lumeer/utils';

import {ResourcePermissionType} from '../../../../../core/model/resource-permission-type';
import {RoleType} from '../../../../../core/model/role-type';
import {AppState} from '../../../../../core/store/app.state';
import {Collection} from '../../../../../core/store/collections/collection';
import {selectCollectionsDictionary} from '../../../../../core/store/collections/collections.state';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Permission, Permissions, Role} from '../../../../../core/store/permissions/permissions';
import {Project} from '../../../../../core/store/projects/project';
import {Team} from '../../../../../core/store/teams/team';
import {User} from '../../../../../core/store/users/user';
import {View} from '../../../../../core/store/views/view';
import {
  teamCanReadWorkspace,
  userCanReadWorkspace,
  userRoleTypesInPermissions,
  userRoleTypesInResource,
} from '../../../../utils/permission.utils';

export enum ViewTab {
  Users = 'users',
  Teams = 'teams',
}

@Component({
  selector: 'view-link-type-permissions-body',
  templateUrl: './view-link-type-permissions-body.component.html',
  styleUrls: ['./view-link-type-permissions-body.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewLinkTypePermissionsBodyComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public collection: Collection;

  @Input()
  public linkType: LinkType;

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
  public linkTypes: LinkType[];

  @Input()
  public collectionPermissions: Permissions;

  @Input()
  public linkTypePermissions: Permissions;

  @Output()
  public submitPermissions = new EventEmitter<{linkTypePermissions: Permissions; collectionPermissions: Permissions}>();

  public userCollectionRoles$ = new BehaviorSubject<Record<string, Role[]>>({});
  public teamCollectionRoles$ = new BehaviorSubject<Record<string, Role[]>>({});
  public userLinkTypeRoles$ = new BehaviorSubject<Record<string, Role[]>>({});
  public teamLinkTypeRoles$ = new BehaviorSubject<Record<string, Role[]>>({});

  public usersWithReadPermission: User[];
  public teamsWithReadPermission: Team[];

  public staticUsers$ = new BehaviorSubject<User[]>([]);
  public collectionsMap$: Observable<Record<string, Collection>>;
  public changeableUsers$ = new BehaviorSubject<User[]>([]);

  public selectedTab$ = new BehaviorSubject<ViewTab>(ViewTab.Users);

  public readonly viewTab = ViewTab;
  public readonly resourcePermissionType = ResourcePermissionType.ViewLinkType;

  private subscriptions = new Subscription();

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.collectionsMap$ = this.store$.pipe(select(selectCollectionsDictionary));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (
      changes.users ||
      changes.teams ||
      changes.organization ||
      changes.project ||
      changes.currentUser ||
      changes.collectionPermissions ||
      changes.linkTypePermissions
    ) {
      this.initUsersAndTeams();
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
    this.userCollectionRoles$.next({...this.userCollectionRoles$.value, [user.id]: []});
    this.userLinkTypeRoles$.next({...this.userLinkTypeRoles$.value, [user.id]: []});
    this.changeableUsers$.next([...this.changeableUsers$.getValue(), user]);
  }

  public deleteUser(user: User) {
    const userCollectionRoles = {...this.userCollectionRoles$.value};
    const userLinkTypeRoles = {...this.userLinkTypeRoles$.value};
    if (user.id) {
      delete userCollectionRoles[user.id];
      delete userLinkTypeRoles[user.id];
      this.changeableUsers$.next(this.changeableUsers$.value.filter(u => u.id !== user.id));
    }

    this.userCollectionRoles$.next(userCollectionRoles);
    this.userCollectionRoles$.next(userLinkTypeRoles);
  }

  public onNewRoles(user: User, roles: Record<ResourcePermissionType, Role[]>) {
    this.userCollectionRoles$.next({
      ...this.userCollectionRoles$.value,
      [user.id]: roles[ResourcePermissionType.ViewCollection],
    });
    this.userLinkTypeRoles$.next({
      ...this.userLinkTypeRoles$.value,
      [user.id]: roles[ResourcePermissionType.ViewLinkType],
    });
  }

  public onNewTeamRoles(team: Team, roles: Record<ResourcePermissionType, Role[]>) {
    this.teamCollectionRoles$.next({
      ...this.teamCollectionRoles$.value,
      [team.id]: roles[ResourcePermissionType.ViewCollection],
    });
    this.teamLinkTypeRoles$.next({
      ...this.teamLinkTypeRoles$.value,
      [team.id]: roles[ResourcePermissionType.ViewLinkType],
    });
  }

  public onUserSelected(user: User) {
    this.addUser(user);
  }

  private initUsers() {
    this.initUsersForPermissions(this.userCollectionRoles$, this.collectionPermissions);
    this.initUsersForPermissions(this.userLinkTypeRoles$, this.linkTypePermissions);
  }

  private initUsersForPermissions(roles$: BehaviorSubject<Record<string, Role[]>>, permissions: Permissions) {
    const userRoles = {...roles$.value};
    for (const user of this.users || []) {
      // user has rights in view or is current user
      if (
        userRoleTypesInResource(this.organization, this.project, this.view, user).length > 0 ||
        user.id === this.currentUser.id
      ) {
        this.addUserToStaticIfNotPresented(user, userRoles, permissions);
      } else if (userRoleTypesInPermissions(this.organization, this.project, permissions, user).length > 0) {
        this.addUserToChangeableIfNotPresented(user, userRoles, permissions);
      }
    }
    this.checkRemovedUsers();

    if (!deepObjectsEquals(userRoles, roles$.value)) {
      roles$.next(userRoles);
    }
  }

  private addUserToStaticIfNotPresented(user: User, rolesMap: Record<string, Role[]>, permissions: Permissions) {
    if (!this.isUserPresented(user)) {
      this.staticUsers$.next([...this.staticUsers$.value, user]);
    }
    rolesMap[user.id] = this.getUserPermissions(user, permissions)?.roles || [];
  }

  private addUserToChangeableIfNotPresented(user: User, rolesMap: Record<string, Role[]>, permissions: Permissions) {
    if (!this.isUserPresented(user)) {
      this.changeableUsers$.next([...this.changeableUsers$.value, user]);
    }
    rolesMap[user.id] = this.getUserPermissions(user, permissions)?.roles || [];
  }

  private isUserPresented(user: User): boolean {
    return (
      !!this.changeableUsers$.value.find(u => u.id === user.id) || !!this.staticUsers$.value.find(u => u.id === user.id)
    );
  }

  private getUserPermissions(user: User, permissions: Permissions): Permission {
    return permissions?.users?.find(permission => permission.id === user.id);
  }

  private checkRemovedUsers() {
    const userIds = this.users.map(user => user.id);
    this.staticUsers$.next(this.staticUsers$.value.filter(user => userIds.includes(user.id)));
    this.changeableUsers$.next(this.changeableUsers$.value.filter(user => userIds.includes(user.id)));
  }

  private initTeams() {
    this.initTeamsForPermissions(this.teamCollectionRoles$, this.collectionPermissions);
    this.initTeamsForPermissions(this.teamLinkTypeRoles$, this.linkTypePermissions);
  }

  private initTeamsForPermissions(roles$: BehaviorSubject<Record<string, Role[]>>, permissions: Permissions) {
    const teamRoles = {...roles$.value};
    let rolesChanged = false;
    for (const team of this.teams || []) {
      if (!teamRoles[team.id]) {
        teamRoles[team.id] = this.getTeamPermissions(team, permissions)?.roles || [];
        rolesChanged = true;
      }
    }
    if (rolesChanged) {
      roles$.next(teamRoles);
    }
  }

  private getTeamPermissions(team: Team, permissions: Permissions): Permission {
    return permissions?.groups?.find(permission => permission.id === team.id);
  }

  public onSubmit() {
    const linkTypePermissions = this.createPermissions(this.userLinkTypeRoles$.value, this.teamLinkTypeRoles$.value);
    const collectionPermissions = this.createPermissions(
      this.userCollectionRoles$.value,
      this.teamCollectionRoles$.value,
      this.userLinkTypeRoles$.value,
      this.teamLinkTypeRoles$.value
    );
    this.submitPermissions.emit({collectionPermissions, linkTypePermissions});
  }

  private createPermissions(
    userRoles: Record<string, Role[]>,
    teamRoles: Record<string, Role[]>,
    otherUserRoles?: Record<string, Role[]>,
    otherTeamRoles?: Record<string, Role[]>
  ): Permissions {
    const allUsersIds = [...this.changeableUsers$.value.map(u => u.id), ...this.staticUsers$.value.map(u => u.id)];

    const userPermissions: Permission[] = Object.keys(userRoles)
      .filter(id => allUsersIds.includes(id))
      .map(id => ({id, roles: addAutomaticRoles(userRoles[id], otherUserRoles?.[id])}));

    const allTeamIds = this.teams.map(team => team.id);

    const teamPermissions: Permission[] = Object.keys(teamRoles)
      .filter(id => allTeamIds.includes(id))
      .map(id => ({id, roles: addAutomaticRoles(teamRoles[id], otherTeamRoles?.[id])}));

    return {users: userPermissions, groups: teamPermissions};
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}

function addAutomaticRoles(roles: Role[], otherRoles?: Role[]): Role[] {
  // this is used in situation when Link has right to Read Data, so the Collection must also have the right
  const resultRoles = [...(roles || [])];
  const dataReadRole = otherRoles?.find(r => r.type === RoleType.DataRead);
  if (dataReadRole) {
    resultRoles.push(dataReadRole);
  }

  const automaticRoleTypes = [RoleType.Read];
  const rolesWithoutAutomatic = (resultRoles || []).filter(role => !automaticRoleTypes.includes(role.type));

  if (rolesWithoutAutomatic.length > 0) {
    return automaticRoleTypes.reduce((allRoles, type) => {
      if (!allRoles.some(role => role.type === type)) {
        allRoles.push({type});
      }
      return allRoles;
    }, rolesWithoutAutomatic);
  }

  return rolesWithoutAutomatic;
}
