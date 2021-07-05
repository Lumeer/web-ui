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
import {map, skip} from 'rxjs/operators';
import {User} from '../../../../../core/store/users/user';
import {Organization} from '../../../../../core/store/organizations/organization';
import {Project} from '../../../../../core/store/projects/project';
import {View} from '../../../../../core/store/views/view';
import {Permission, Permissions, Role} from '../../../../../core/store/permissions/permissions';
import {BehaviorSubject, combineLatest, Subscription} from 'rxjs';
import {ClipboardService} from '../../../../../core/service/clipboard.service';
import {generateCorrelationId} from '../../../../utils/resource.utils';
import {containsSameElements, uniqueValues} from '../../../../utils/array.utils';
import {
  teamCanReadWorkspace,
  userCanReadAllInWorkspace,
  userCanReadWorkspace,
  userHasAnyRoleInResource,
  userHasRoleInProject,
} from '../../../../utils/permission.utils';
import {Team} from '../../../../../core/store/teams/team';
import {RoleType} from '../../../../../core/model/role-type';
import {deepObjectsEquals} from '../../../../utils/common.utils';

export enum ViewTab {
  Users = 'users',
  Teams = 'teams',
}

@Component({
  selector: 'share-view-dialog-body',
  templateUrl: './share-view-dialog-body.component.html',
  styleUrls: ['./share-view-dialog-body.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareViewDialogBodyComponent implements OnInit, OnChanges, OnDestroy {
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

  @Output()
  public submitForm = new EventEmitter<{
    permissions: Permissions;
    newUsers: User[];
    newUsersRoles: Record<string, Role[]>;
    newTeams: Team[];
  }>();

  @Output()
  public rolesChanged = new EventEmitter<boolean>();

  public userRoles$ = new BehaviorSubject<Record<string, Role[]>>({});
  public teamRoles$ = new BehaviorSubject<Record<string, Role[]>>({});

  public usersWithReadPermission: User[];
  public teamsWithReadPermission: Team[];

  public staticUsers$ = new BehaviorSubject<User[]>([]);
  public changeableUsers$ = new BehaviorSubject<User[]>([]);
  public newUsers$ = new BehaviorSubject<User[]>([]);

  public selectedTab$ = new BehaviorSubject<ViewTab>(ViewTab.Users);

  public viewShareUrl$ = new BehaviorSubject<string>('');

  public readonly viewTab = ViewTab;

  private subscriptions = new Subscription();

  constructor(private clipboardService: ClipboardService) {}

  public ngOnInit() {
    this.parseViewShareUrl();
    this.subscribeToRoles();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.users || changes.teams || changes.organization || changes.project || changes.currentUser) {
      const canInviteUsers = userHasRoleInProject(
        this.organization,
        this.project,
        this.currentUser,
        RoleType.UserConfig
      );

      if (canInviteUsers) {
        this.usersWithReadPermission = this.users;
        this.teamsWithReadPermission = this.teams;
      } else {
        this.usersWithReadPermission =
          this.users?.filter(user => userCanReadWorkspace(this.organization, this.project, user)) || [];
        this.teamsWithReadPermission =
          this.teams?.filter(team => teamCanReadWorkspace(this.organization, this.project, team)) || [];
      }

      this.initUsers(this.currentUser, this.organization, this.project);
      this.initTeams();
    }
  }

  public copyToClipboard() {
    this.clipboardService.copy(this.viewShareUrl$.getValue());
  }

  private addUser(user: User) {
    this.userRoles$.next({...this.userRoles$.getValue(), [user.id]: []});
    this.changeableUsers$.next([...this.changeableUsers$.getValue(), user]);
  }

  public addNewUser(text: string) {
    const newUser: User = {correlationId: generateCorrelationId(), email: text};
    this.userRoles$.next({...this.userRoles$.value, [newUser.correlationId]: []});
    this.newUsers$.next([...this.newUsers$.value, newUser]);
  }

  public deleteUser(user: User) {
    const userRoles = {...this.userRoles$.value};
    if (user.id) {
      delete userRoles[user.id];
      this.changeableUsers$.next(this.changeableUsers$.value.filter(u => u.id !== user.id));
    } else if (user.correlationId) {
      delete userRoles[user.correlationId];
      this.newUsers$.next(this.newUsers$.value.filter(u => u.correlationId !== user.correlationId));
    }

    this.userRoles$.next(userRoles);
  }

  public onNewRoles(user: User, roles: Role[]) {
    this.userRoles$.next({...this.userRoles$.value, [user.id || user.correlationId]: roles});
  }

  public onNewTeamRoles(team: Team, roles: Role[]) {
    this.teamRoles$.next({...this.teamRoles$.value, [team.id]: roles});
  }

  public onUserSelected(user: User) {
    this.addUser(user);
  }

  private initUsers(currentUser: User, organization: Organization, project: Project) {
    const userRoles = {...this.userRoles$.value};
    for (const user of this.users || []) {
      if (userCanReadAllInWorkspace(organization, project, user) || user.id === currentUser.id) {
        this.addUserToStaticIfNotPresented(user, userRoles);
      } else if (userHasAnyRoleInResource(this.view, user)) {
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
      rolesMap[user.id] = this.getUserPermissionsInView(user)?.roles || [];
    }
  }

  private addUserToChangeableIfNotPresented(user: User, rolesMap: Record<string, Role[]>) {
    if (!this.isUserPresented(user)) {
      this.changeableUsers$.next([...this.changeableUsers$.value, user]);
      rolesMap[user.id] = this.getUserPermissionsInView(user)?.roles || [];
    }
  }

  private isUserPresented(user: User): boolean {
    return (
      !!this.changeableUsers$.value.find(u => u.id === user.id) || !!this.staticUsers$.value.find(u => u.id === user.id)
    );
  }

  private getUserPermissionsInView(user: User): Permission {
    return this.view?.permissions?.users?.find(permission => permission.id === user.id);
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
        teamRoles[team.id] = this.getTeamPermissionsInView(team)?.roles || [];
        rolesChanged = true;
      }
    }
    if (rolesChanged) {
      this.teamRoles$.next(teamRoles);
    }
  }

  private getTeamPermissionsInView(team: Team): Permission {
    return this.view?.permissions?.groups?.find(permission => permission.id === team.id);
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

    const newUsers = this.newUsers$.value;
    const newUsersFiltered: User[] = Object.keys(userRoles)
      .map(id => newUsers.find(user => user.correlationId === id))
      .filter(user => !!user)
      .filter(user => (userRoles[user.correlationId] || []).length > 0);

    const newTeams = this.teams.filter(
      team => !teamCanReadWorkspace(this.organization, this.project, team) && (teamRoles[team.id] || []).length > 0
    );

    const permissions: Permissions = {users: userPermissions, groups: teamPermissions};

    this.submitForm.next({permissions, newUsers: newUsersFiltered, newUsersRoles: userRoles, newTeams});
  }

  private subscribeToRoles() {
    this.subscriptions.add(
      combineLatest([this.userRoles$, this.teamRoles$])
        .pipe(
          skip(1),
          map(
            ([userRoles, teamRoles]) =>
              this.viewPermissionsChanged(this.view?.permissions?.users, userRoles) ||
              this.viewPermissionsChanged(this.view?.permissions?.groups, teamRoles)
          )
        )
        .subscribe(changed => this.rolesChanged.emit(changed))
    );
  }

  private viewPermissionsChanged(initialPermissions: Permission[], currentRolesMap: Record<string, Role[]>): boolean {
    const initialRolesMap = (initialPermissions || []).reduce(
      (map, permission) => ({
        ...map,
        [permission.id]: permission.roles,
      }),
      {}
    );

    const keys = uniqueValues([...Object.keys(initialRolesMap), ...Object.keys(currentRolesMap)]);

    for (const id of keys) {
      const currentRoleTypes = uniqueValues((currentRolesMap[id] || []).map(role => role.type));
      const initialRoleTypes = uniqueValues((initialRolesMap[id] || []).map(role => role.type));
      if (!containsSameElements(currentRoleTypes, initialRoleTypes)) {
        return true;
      }
    }

    return false;
  }

  private parseViewShareUrl() {
    const currentUrl = window.location.href;
    const match = currentUrl.match('(.+/w/[^/]+/[^/]+/).*');
    if (match && match[1]) {
      this.viewShareUrl$.next(match[1] + 'view;vc=' + this.view.code);
    }
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
