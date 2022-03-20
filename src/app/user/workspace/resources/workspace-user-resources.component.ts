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

import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {Observable, combineLatest} from 'rxjs';
import {Workspace} from '../../../core/store/navigation/workspace';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectWorkspaceWithIds} from '../../../core/store/common/common.selectors';
import {ResourceType} from '../../../core/model/resource-type';
import {ResourceRolesData} from '../../settings/tab/resources/list/user-resources-list.component';
import {selectUserByWorkspace} from '../../../core/store/users/users.state';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {selectProjectsForWorkspace} from '../../../core/store/projects/projects.state';
import {map} from 'rxjs/operators';
import {userTransitiveRoles} from '../../../shared/utils/permission.utils';
import {Organization} from '../../../core/store/organizations/organization';
import {User} from '../../../core/store/users/user';
import {Project} from '../../../core/store/projects/project';
import {ActivatedRoute, Router} from '@angular/router';

@Component({
  templateUrl: './workspace-user-resources.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceUserResourcesComponent implements OnInit {
  public readonly resourceType = ResourceType;

  public workspace$: Observable<Workspace>;
  public projectsData$: Observable<ResourceRolesData[]>;

  constructor(private store$: Store<AppState>, private router: Router, private route: ActivatedRoute) {}

  public ngOnInit() {
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.projectsData$ = combineLatest([
      this.store$.pipe(select(selectUserByWorkspace)),
      this.store$.pipe(select(selectOrganizationByWorkspace)),
      this.store$.pipe(select(selectProjectsForWorkspace)),
    ]).pipe(
      map(([user, organization, projects]) =>
        projects
          .map(project => this.computeData(project, organization, user))
          .filter(datum => datum.roles.length || datum.transitiveRoles.length)
      )
    );
  }

  private computeData(project: Project, organization: Organization, user: User): ResourceRolesData {
    const transitiveRoles = userTransitiveRoles(organization, project, user, ResourceType.Project, project.permissions);
    const roles = project.permissions?.users?.find(role => role.id === user.id)?.roles || [];

    return {
      roles,
      transitiveRoles,
      id: project.code,
      name: project.code,
      colors: [project.color],
      icons: [project.icon],
    };
  }

  public onProjectSelect(value: string) {
    this.router.navigate([], {queryParams: {projectCode: value}, relativeTo: this.route, queryParamsHandling: 'merge'});
  }
}
