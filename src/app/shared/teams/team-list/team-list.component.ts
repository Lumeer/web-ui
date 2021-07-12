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

import {User} from '../../../core/store/users/user';
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
import {deepObjectCopy} from '../../utils/common.utils';

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

  public users$: Observable<User[]>;
  public permissions$ = new BehaviorSubject<Permissions>(null);
  public teams$ = new BehaviorSubject<Team[]>([]);

  constructor(private store$: Store<AppState>) {}

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
    if(changes.resource) {
      this.permissions$.next(this.resource?.permissions);
    }
  }

  public onTeamUpdated(team: Team) {
    const teams = [...this.teams];
    const teamIndex = teams.findIndex(t => t.id === team.id);
    teams[teamIndex] = team;

    if (this.currentUserLostUserConfig(this.organization, this.project, this.resource, teams)) {
      this.teams$.next(deepObjectCopy(this.teams));
      console.log('lost right by team update');
    } else {
      this.teamUpdated.emit(team);
    }
  }

  public onTeamDeleted(team: Team) {
    const teams = [...this.teams];
    const teamIndex = teams.findIndex(t => t.id === team.id);
    teams.splice(teamIndex, 1);

    if (this.currentUserLostUserConfig(this.organization, this.project, this.resource, teams)) {
      console.log('lost right by team delete');
    } else {
      this.teamDeleted.emit(team);
    }
  }

  public onTeamRemoved(team: Team) {
    this.teamDeleted.emit(team);
  }

  public onTeamRolesChange(data: {team: Team; roles: Role[]}) {
    const newPermission: Permission = {roles: data.roles, id: data.team.id};
    const newPermissions = PermissionsHelper.changePermission(this.resource.permissions, PermissionType.Groups, [
      newPermission,
    ]);
    const newResource = {...this.resource, permissions: newPermissions};

    if (this.currentUserLostUserConfig(this.organization, this.project, newResource, this.teams)) {
      this.permissions$.next(deepObjectCopy(this.resource.permissions));
      console.log('lost right by team roles change');
    } else {
      this.teamRolesChange.emit(data);
    }
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
