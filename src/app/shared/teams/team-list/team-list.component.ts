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
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';

import {User, UserHintsKeys} from '../../../core/store/users/user';
import {ResourceType} from '../../../core/model/resource-type';
import {Project} from '../../../core/store/projects/project';
import {Organization} from '../../../core/store/organizations/organization';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable} from 'rxjs';
import {Team} from '../../../core/store/teams/team';
import {selectUsersForWorkspace} from '../../../core/store/users/users.state';
import {Permission, Permissions, PermissionType, Role} from '../../../core/store/permissions/permissions';
import {ServiceLimits} from '../../../core/store/organizations/service-limits/service.limits';
import {Resource} from '../../../core/model/resource';
import {userHasRoleInOrganization, userHasRoleInProject, userHasRoleInResource} from '../../utils/permission.utils';
import {RoleType} from '../../../core/model/role-type';
import {PermissionsHelper} from '../../../core/store/permissions/permissions.helper';
import {NotificationService} from '../../../core/notifications/notification.service';
import {NotificationButton} from '../../../core/notifications/notification-button';
import {ResourcePermissionType, resourcePermissionTypeMap} from '../../../core/model/resource-permission-type';
import {deepObjectCopy} from '@lumeer/utils';

@Component({
  selector: 'team-list',
  templateUrl: './team-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamListComponent implements OnInit, OnChanges {
  @Input()
  public resourceType: ResourceType;

  @Input()
  public teams: Team[];

  @Input()
  public resource: Resource;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public currentUser: User;

  @Input()
  public serviceLimits: ServiceLimits;

  @Output()
  public teamCreated = new EventEmitter<string>();

  @Output()
  public teamUpdated = new EventEmitter<Team>();

  @Output()
  public teamDeleted = new EventEmitter<Team>();

  @Output()
  public teamRolesChange = new EventEmitter<{team: Team; roles: Role[]}>();

  public teamIds: string[];
  public groupsAreEditable: boolean;
  public resourcePermissionType: ResourcePermissionType;

  public users$: Observable<User[]>;
  public permissions$ = new BehaviorSubject<Permissions>(null);
  public teams$ = new BehaviorSubject<Team[]>([]);

  public readonly userHintsKeys = UserHintsKeys;

  constructor(
    private store$: Store<AppState>,
    private notificationService: NotificationService
  ) {}

  public ngOnInit() {
    this.users$ = this.store$.pipe(select(selectUsersForWorkspace));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.teams) {
      this.teamIds = (this.teams || []).map(team => team.id);
      this.teams$.next(this.teams);
    }
    if (changes.serviceLimits) {
      this.groupsAreEditable = this.serviceLimits?.groups || false;
    }
    if (changes.resource) {
      this.permissions$.next(this.resource?.permissions);
    }
    if (changes.resourceType) {
      this.resourcePermissionType = resourcePermissionTypeMap[this.resourceType];
    }
  }

  public onTeamUpdated(team: Team) {
    const teams = [...this.teams];
    const teamIndex = teams.findIndex(t => t.id === team.id);
    teams[teamIndex] = team;

    if (this.currentUserLostUserConfig(this.organization, this.project, this.resource, teams)) {
      this.askToPerformUpdate(
        () => this.teamUpdated.emit(team),
        () => this.resetTeams()
      );
    } else {
      this.teamUpdated.emit(team);
    }
  }

  private resetTeams() {
    this.teams$.next(deepObjectCopy(this.teams));
  }

  public onTeamDeleted(team: Team) {
    const teams = [...this.teams];
    const teamIndex = teams.findIndex(t => t.id === team.id);
    teams.splice(teamIndex, 1);

    if (this.currentUserLostUserConfig(this.organization, this.project, this.resource, teams)) {
      this.askToPerformUpdate(() => this.teamDeleted.emit(team));
    } else {
      this.teamDeleted.emit(team);
    }
  }

  public onTeamRemoved(team: Team) {
    this.teamDeleted.emit(team);
  }

  public onTeamRolesChange(data: {team: Team; roles: Record<ResourcePermissionType, Role[]>}) {
    const roles = data.roles[this.resourcePermissionType];
    const newPermission: Permission = {roles, id: data.team.id};
    const newPermissions = PermissionsHelper.changePermission(this.resource.permissions, PermissionType.Groups, [
      newPermission,
    ]);
    const newResource = {...this.resource, permissions: newPermissions};

    if (this.currentUserLostUserConfig(this.organization, this.project, newResource, this.teams)) {
      this.askToPerformUpdate(
        () => this.teamRolesChange.emit({...data, roles}),
        () => this.resetPermissions()
      );
    } else {
      this.teamRolesChange.emit({...data, roles});
    }
  }

  private resetPermissions() {
    this.permissions$.next(deepObjectCopy(this.resource.permissions));
  }

  private askToPerformUpdate(confirm: () => void, cancel?: () => void) {
    const message = $localize`:@@teams.list.lost.permissions.message:By confirming this action, you will lose the rights to manage users and teams and will not be able to revert it back.`;
    const title = $localize`:@@teams.list.lost.permissions.title:Be careful, there is risk of losing access.`;
    const yesButton = {text: $localize`:@@teams.list.lost.permissions.confirm:Save anyway`, action: confirm};
    const noButton = {text: $localize`:@@button.cancel:Cancel`, action: cancel};

    const buttons: NotificationButton[] = [noButton, yesButton];

    this.notificationService.confirm(message, title, buttons, 'warning');
  }

  private currentUserLostUserConfig(
    organization: Organization,
    project: Project,
    resource: Resource,
    teams: Team[]
  ): boolean {
    const userTeams = (teams || []).filter(team => team.users?.includes(this.currentUser.id));
    const userWithTeams = {...this.currentUser, teams: userTeams};

    switch (this.resourceType) {
      case ResourceType.Organization:
        return !userHasRoleInOrganization(resource, userWithTeams, RoleType.UserConfig);
      case ResourceType.Project:
        return !userHasRoleInProject(organization, resource, userWithTeams, RoleType.UserConfig);
      default:
        return !userHasRoleInResource(organization, project, resource, userWithTeams, RoleType.UserConfig);
    }
  }
}
