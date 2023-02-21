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

import {Component, ChangeDetectionStrategy, Input, OnInit, Output, EventEmitter} from '@angular/core';
import {View} from '../../../../../../core/store/views/view';
import {User} from '../../../../../../core/store/users/user';
import {Organization} from '../../../../../../core/store/organizations/organization';
import {Project} from '../../../../../../core/store/projects/project';
import {Team} from '../../../../../../core/store/teams/team';
import {AppState} from '../../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {ServiceLimits} from '../../../../../../core/store/organizations/service-limits/service.limits';
import {Observable} from 'rxjs';
import {selectServiceLimitsByWorkspace} from '../../../../../../core/store/organizations/service-limits/service-limits.state';
import {Permissions, Role} from '../../../../../../core/store/permissions/permissions';
import {Collection} from '../../../../../../core/store/collections/collection';
import {selectCollectionsDictionary} from '../../../../../../core/store/collections/collections.state';
import {ResourcePermissionType} from '../../../../../../core/model/resource-permission-type';

@Component({
  selector: 'view-teams',
  templateUrl: './view-teams.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewTeamsComponent implements OnInit {
  @Input()
  public view: View;

  @Input()
  public permissions: Permissions;

  @Input()
  public teams: Team[];

  @Input()
  public users: User[];

  @Input()
  public currentUser: User;

  @Input()
  public organization: Organization;

  @Input()
  public project: Project;

  @Output()
  public teamRolesChange = new EventEmitter<{team: Team; roles: Role[]}>();

  public readonly resourcePermissionType = ResourcePermissionType.View;

  public serviceLimits$: Observable<ServiceLimits>;
  public collectionsMap$: Observable<Record<string, Collection>>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.serviceLimits$ = this.store$.pipe(select(selectServiceLimitsByWorkspace));
    this.collectionsMap$ = this.store$.pipe(select(selectCollectionsDictionary));
  }

  public onTeamRolesChange(data: {team: Team; roles: Record<ResourcePermissionType, Role[]>}) {
    const roles = data.roles[this.resourcePermissionType];
    this.teamRolesChange.emit({team: data.team, roles});
  }
}
