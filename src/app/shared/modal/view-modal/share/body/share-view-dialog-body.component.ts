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
import {Permission, Role} from '../../../../../core/store/permissions/permissions';
import {BehaviorSubject, Subscription} from 'rxjs';
import {ClipboardService} from '../../../../../core/service/clipboard.service';
import {isNullOrUndefined} from '../../../../utils/common.utils';
import {generateCorrelationId} from '../../../../utils/resource.utils';
import {containsSameElements} from '../../../../utils/array.utils';
import {
  userCanReadAllInWorkspace,
  userCanReadWorkspace,
  userHasRoleInOrganization, userHasRoleInProject
} from '../../../../utils/permission.utils';
import {Team} from '../../../../../core/store/teams/team';
import {RoleType} from '../../../../../core/model/role-type';

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
    permissions: Permission[];
    newUsers: User[];
    newUsersRoles: Record<string, Role[]>;
  }>();

  @Output()
  public rolesChanged = new EventEmitter<boolean>();

  public userRoles$ = new BehaviorSubject<Record<string, Role[]>>({});
  public teamRoles$ = new BehaviorSubject<Record<string, Role[]>>({});

  public staticUsers: User[] = [];
  public initialUserRoles: Record<string, Role[]> = {};
  public usersWithReadPermission: User[];

  public changeableUsers$ = new BehaviorSubject<User[]>([]);
  public newUsers$ = new BehaviorSubject<User[]>([]);

  public selectedTab$ = new BehaviorSubject<ViewTab>(ViewTab.Users);

  public viewShareUrl$ = new BehaviorSubject<string>('');

  public readonly viewTab = ViewTab;

  private subscriptions = new Subscription();

  constructor(private clipboardService: ClipboardService) {
  }

  public ngOnInit() {
    this.parseViewShareUrl();
    this.subscribeToRoles();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.users || changes.organization || changes.project || changes.currentUser) {
      const canInviteUsers = userHasRoleInProject(this.organization, this.project, this.currentUser, RoleType.UserConfig)
      if (canInviteUsers) {
        this.usersWithReadPermission = this.users
      } else {
        this.usersWithReadPermission =
          this.users?.filter(user => userCanReadWorkspace(this.organization, this.project, user)) || [];
      }
    }
    if (this.currentUser && this.organization && this.project && this.view) {
      this.initUsers(this.currentUser, this.organization, this.project);
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
    this.userRoles$.next({...this.userRoles$.getValue(), [newUser.correlationId]: []});
    this.newUsers$.next([...this.newUsers$.getValue(), newUser]);
  }

  public deleteUser(user: User) {
    const userRoles = {...this.userRoles$.getValue()};
    if (user.id) {
      delete userRoles[user.id];
      this.changeableUsers$.next(this.changeableUsers$.getValue().filter(u => u.id !== user.id));
    } else if (user.correlationId) {
      delete userRoles[user.correlationId];
      this.newUsers$.next(this.newUsers$.getValue().filter(u => u.correlationId !== user.correlationId));
    }

    this.userRoles$.next(userRoles);
  }

  public onNewRoles(user: User, roles: Role[]) {
    this.userRoles$.next({...this.userRoles$.getValue(), [user.id || user.correlationId]: roles});
  }

  public onNewTeamRoles(team: Team, roles: Role[]) {
    this.teamRoles$.next({...this.teamRoles$.getValue(), [team.id]: roles});
  }

  private isUserPresented(user: User): boolean {
    return (
      !!this.changeableUsers$.getValue().find(u => u.id === user.id) || !!this.staticUsers.find(u => u.id === user.id)
    );
  }

  public onUserSelected(user: User) {
    this.addUser(user);
  }

  private getUserPermissionsInView(user: User): Permission {
    return this.view.permissions.users.find(permission => permission.id === user.id);
  }

  private initUsers(currentUser: User, organization: Organization, project: Project) {
    for (const user of this.users || []) {
      if (userCanReadAllInWorkspace(organization, project, user) || user.id === currentUser.id) {
        this.addUserToStaticIfNotPresented(user);
      } else if ((this.view.permissions?.users || []).find(u => u.id === user.id)) {
        this.addUserToChangeableIfNotPresented(user);
      }
    }
    this.checkRemovedUsers();
  }

  private addUserToStaticIfNotPresented(user: User) {
    if (!this.isUserPresented(user)) {
      this.staticUsers.push(user);
      this.initRolesForUser(user);
    }
  }

  private initRolesForUser(user: User,) {
    const roles = this.getUserPermissionsInView(user)?.roles;
    this.userRoles$.next({...this.userRoles$.getValue(), [user.id]: roles});
    this.initialUserRoles[user.id] = roles;
  }

  private addUserToChangeableIfNotPresented(user: User) {
    if (!this.isUserPresented(user)) {
      this.changeableUsers$.next([...this.changeableUsers$.getValue(), user]);
      this.initRolesForUser(user);
    }
  }

  private checkRemovedUsers() {
    const userIds = this.users.map(user => user.id);
    this.staticUsers = this.staticUsers.filter(user => userIds.includes(user.id));
    this.changeableUsers$.next(this.changeableUsers$.getValue().filter(user => userIds.includes(user.id)));
  }

  public onSubmit() {
    const userRoles = this.userRoles$.getValue();
    const newUsers = this.newUsers$.getValue();
    const changeableUsers = this.changeableUsers$.getValue();

    const changeablePermissions: Permission[] = Object.keys(userRoles)
      .filter(id => changeableUsers.find(user => user.id === id))
      .map(id => ({id, roles: userRoles[id]}));

    const staticPermissions = this.staticUsers
      .map(user => this.getUserPermissionsInView(user))
      .filter(permission => permission && permission.roles && permission.roles.length > 0);

    const permissions = [...changeablePermissions, ...staticPermissions];

    const newUsersFiltered: User[] = Object.keys(userRoles)
      .map(id => newUsers.find(user => user.correlationId === id))
      .filter(user => !!user)
      .filter(user => (userRoles[user.correlationId] || []).length > 0);

    console.log(changeablePermissions, staticPermissions);

    this.submitForm.next({permissions, newUsers: newUsersFiltered, newUsersRoles: userRoles});
  }

  private subscribeToRoles() {
    this.subscriptions.add(
      this.userRoles$
        .asObservable()
        .pipe(
          skip(1),
          map(roles => this.viewPermissionsChanged(this.initialUserRoles, roles))
        )
        .subscribe(changed => this.rolesChanged.emit(changed))
    );
  }

  private viewPermissionsChanged(
    initialUserPermissions: Record<string, Role[]>,
    currentUserPermissions: Record<string, Role[]>
  ): boolean {
    if (!initialUserPermissions || !currentUserPermissions) {
      return false;
    }

    if (Object.keys(initialUserPermissions).length !== Object.keys(currentUserPermissions).length) {
      return true;
    }

    for (const id of Object.keys(initialUserPermissions)) {
      const currentRoles = currentUserPermissions[id];
      const userRoles = initialUserPermissions[id];
      if (isNullOrUndefined(currentRoles) || !containsSameElements(currentRoles, userRoles)) {
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
