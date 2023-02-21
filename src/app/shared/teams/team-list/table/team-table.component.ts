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
import {Organization} from '../../../../core/store/organizations/organization';
import {Project} from '../../../../core/store/projects/project';
import {ResourcePermissionType} from '../../../../core/model/resource-permission-type';
import {View} from '../../../../core/store/views/view';

@Component({
  selector: 'team-table',
  templateUrl: './team-table.component.html',
  styleUrls: ['./team-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamTableComponent {
  @Input()
  public users: User[];

  @Input()
  public teams: Team[];

  @Input()
  public permissionsMap: Record<ResourcePermissionType, Permissions>;

  @Input()
  public resourcePermissionType: ResourcePermissionType;

  @Input()
  public deletableTeamIds: string[];

  @Input()
  public removableTeamIds: string[];

  @Input()
  public editable: boolean;

  @Input()
  public color: string;

  @Input()
  public changeRoles: boolean;

  @Input()
  public editableTeams: boolean;

  @Input()
  public emitAllChanges: boolean;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Input()
  public viewsMap: Record<ResourcePermissionType, View>;

  @Output()
  public teamUpdated = new EventEmitter<Team>();

  @Output()
  public teamDeleted = new EventEmitter<Team>();

  @Output()
  public teamRemoved = new EventEmitter<Team>();

  @Output()
  public teamRolesChange = new EventEmitter<{team: Team; roles: Record<ResourcePermissionType, Role[]>}>();

  public searchString: string;

  public trackByTeam(index: number, team: Team): string {
    return team.id;
  }
}
