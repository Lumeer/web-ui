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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {combineLatest, Observable} from 'rxjs';
import {Workspace} from '../../../core/store/navigation/workspace';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectWorkspaceWithIds} from '../../../core/store/common/common.selectors';
import {ResourceType} from '../../../core/model/resource-type';
import {selectCurrentUser, selectUserByWorkspace} from '../../../core/store/users/users.state';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {selectProjectsForWorkspace} from '../../../core/store/projects/projects.state';
import {map} from 'rxjs/operators';
import {userTransitiveRoles} from '../../../shared/utils/permission.utils';
import {Organization} from '../../../core/store/organizations/organization';
import {User} from '../../../core/store/users/user';
import {Project} from '../../../core/store/projects/project';
import {ActivatedRoute, Router} from '@angular/router';
import {
  ResourceRolesData,
  resourceRolesDataEmptyTitle,
  ResourceRolesDatum,
} from '../../settings/tab/resources/list/resource-roles-data';

@Component({
  templateUrl: './workspace-user-resources.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block px-3', style: 'margin-top: 2.25rem'},
})
export class WorkspaceUserResourcesComponent implements OnInit {
  public workspace$: Observable<Workspace>;
  public projectsData$: Observable<ResourceRolesData>;
  public selectedDatum$: Observable<ResourceRolesDatum>;

  constructor(private store$: Store<AppState>, private router: Router, private route: ActivatedRoute) {}

  public ngOnInit() {
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.projectsData$ = combineLatest([
      this.store$.pipe(select(selectUserByWorkspace)),
      this.store$.pipe(select(selectOrganizationByWorkspace)),
      this.store$.pipe(select(selectProjectsForWorkspace)),
      this.store$.pipe(select(selectCurrentUser)),
    ]).pipe(
      map(([user, organization, projects, currentUser]) => {
        const objects = projects
          .map(project => this.computeData(project, organization, user))
          .filter(datum => datum.roles.length || datum.transitiveRoles.length);

        const emptyTitle = resourceRolesDataEmptyTitle(ResourceType.Project, user.id === currentUser?.id);
        return {objects, emptyTitle};
      })
    );

    this.selectedDatum$ = combineLatest([this.projectsData$, this.workspace$]).pipe(
      map(([data, workspace]) => data.objects.find(datum => datum.id === workspace?.projectId))
    );
  }

  private computeData(project: Project, organization: Organization, user: User): ResourceRolesDatum {
    const transitiveRoles = userTransitiveRoles(organization, project, user, ResourceType.Project, project.permissions);
    const roles = project.permissions?.users?.find(role => role.id === user.id)?.roles || [];

    return {
      roles,
      transitiveRoles,
      id: project.id,
      name: project.code,
      colors: [project.color],
      icons: [project.icon],
    };
  }

  public onProjectSelect(value: string) {
    this.router.navigate([], {queryParams: {projectCode: value}, relativeTo: this.route, queryParamsHandling: 'merge'});
  }
}
