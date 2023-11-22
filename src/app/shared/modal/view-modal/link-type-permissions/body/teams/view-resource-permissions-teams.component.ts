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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';

import {ResourcePermissionType} from '../../../../../../core/model/resource-permission-type';
import {AppState} from '../../../../../../core/store/app.state';
import {Organization} from '../../../../../../core/store/organizations/organization';
import {selectServiceLimitsByWorkspace} from '../../../../../../core/store/organizations/service-limits/service-limits.state';
import {ServiceLimits} from '../../../../../../core/store/organizations/service-limits/service.limits';
import {Permissions, Role} from '../../../../../../core/store/permissions/permissions';
import {Project} from '../../../../../../core/store/projects/project';
import {Team} from '../../../../../../core/store/teams/team';
import {User} from '../../../../../../core/store/users/user';
import {View} from '../../../../../../core/store/views/view';

@Component({
  selector: 'view-resource-permissions-teams',
  templateUrl: './view-resource-permissions-teams.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewResourcePermissionsTeamsComponent implements OnInit {
  @Input()
  public viewsMap: Record<ResourcePermissionType, View>;

  @Input()
  public permissionsMap: Record<ResourcePermissionType, Permissions>;

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

  @Input()
  public color: string;

  @Input()
  public resourceType: ResourcePermissionType;

  @Output()
  public teamRolesChange = new EventEmitter<{team: Team; roles: Record<ResourcePermissionType, Role[]>}>();

  public serviceLimits$: Observable<ServiceLimits>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.serviceLimits$ = this.store$.pipe(select(selectServiceLimitsByWorkspace));
  }
}
