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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {filter, map, switchMap, take} from 'rxjs/operators';
import {AppState} from '../store/app.state';
import {Organization} from '../store/organizations/organization';
import {selectAllOrganizations} from '../store/organizations/organizations.state';
import {Project} from '../store/projects/project';
import {selectAllProjects} from '../store/projects/projects.state';
import {DefaultWorkspace} from '../store/users/user';
import {selectCurrentUser} from '../store/users/users.state';
import {NotificationService} from '../notifications/notification.service';
import {WorkspaceSelectService} from '../service/workspace-select.service';
import {Perspective} from '../../view/perspectives/perspective';
import {selectPublicViewCode} from '../store/public-data/public-data.state';
import {ConfigurationService} from '../../configuration/configuration.service';
import {selectAllTeams} from '../store/teams/teams.state';
import {userHasRoleInOrganization, userHasRoleInProject} from '../../shared/utils/permission.utils';
import {RoleType} from '../model/role-type';
import {sortResourcesByOrder} from '../../shared/utils/resource.utils';

@Component({
  template: '',
})
export class HomeComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  public constructor(
    private router: Router,
    private notificationService: NotificationService,
    private selectService: WorkspaceSelectService,
    private store$: Store<AppState>,
    private route: ActivatedRoute,
    private configurationService: ConfigurationService
  ) {}

  public ngOnInit() {
    if (this.configurationService.getConfiguration().publicView) {
      this.subscriptions.add(this.redirectToPublicWorkspace());
    } else {
      this.subscriptions.add(this.redirectToWorkspace());
    }
  }

  private redirectToPublicWorkspace(): Subscription {
    return this.getOrganizationsAndProjects()
      .pipe(take(1))
      .subscribe(({organizationsWithProjects}) => {
        const organization = organizationsWithProjects[0];
        const project = organization?.projects?.[0];

        this.store$.pipe(select(selectPublicViewCode), take(1)).subscribe(viewCode => {
          if (organization && project) {
            this.navigateToProject(organization, project, viewCode || project?.templateMetadata?.defaultView);
          } else {
            // TODO show some error page
          }
        });
      });
  }

  private redirectToWorkspace(): Subscription {
    return combineLatest([this.getDefaultWorkspace(), this.getOrganizationsAndProjects()])
      .pipe(take(1))
      .subscribe(([workspace, {organizationsWithProjects, contributeOrganizations}]) => {
        if (organizationsWithProjects.length > 0) {
          this.navigateToWorkspaceProject(workspace, organizationsWithProjects);
        } else if (contributeOrganizations.length === 0) {
          this.selectService.createNewOrganization({replaceUrl: true});
        } else {
          this.selectService.createNewProjectWithTemplate(contributeOrganizations, null, null, {replaceUrl: true});
        }
      });
  }

  private navigateToWorkspaceProject(
    workspace: DefaultWorkspace,
    organizationsWithProjects: OrganizationWithProjects[]
  ) {
    const workspaceOrganization =
      workspace?.organizationId && organizationsWithProjects.find(org => org.id === workspace.organizationId);
    const workspaceProject =
      workspace?.projectId && workspaceOrganization?.projects?.find(proj => proj.id === workspace.projectId);

    if (workspaceOrganization) {
      this.navigateToProject(workspaceOrganization, workspaceProject || workspaceOrganization.projects[0]);
    } else {
      this.navigateToProject(organizationsWithProjects[0], organizationsWithProjects[0].projects[0]);
    }
  }

  private navigateToProject(organization: Organization, project: Project, viewCode?: string): Promise<boolean> {
    const path: any[] = ['/', 'w', organization.code, project.code, 'view'];
    if (viewCode) {
      path.push({vc: viewCode});
    } else {
      path.push(Perspective.Search);
    }
    return this.router.navigate(path, {replaceUrl: true});
  }

  private getDefaultWorkspace(): Observable<DefaultWorkspace> {
    return this.store$.select(selectCurrentUser).pipe(
      filter(user => !!user),
      map(user => user.defaultWorkspace)
    );
  }

  private getOrganizationsAndProjects(): Observable<{
    organizationsWithProjects: OrganizationWithProjects[];
    contributeOrganizations: Organization[];
  }> {
    return combineLatest([
      this.store$.pipe(select(selectAllOrganizations)),
      this.store$.pipe(select(selectAllProjects)),
    ]).pipe(
      switchMap(([organizations, projects]) => this.filterReadableOrganizationsAndProjects(organizations, projects))
    );
  }

  private filterReadableOrganizationsAndProjects(
    organizations: Organization[],
    projects: Project[]
  ): Observable<{organizationsWithProjects: OrganizationWithProjects[]; contributeOrganizations: Organization[]}> {
    return combineLatest([this.store$.pipe(select(selectCurrentUser)), this.store$.pipe(select(selectAllTeams))]).pipe(
      map(([user, teams]) => {
        const readableOrganizations = [];
        const contributeOrganizations = [];
        for (const organization of organizations) {
          const userTeams = teams.filter(
            team => team.organizationId === organization.id && team.users?.includes(user.id)
          );
          const organizationUser = {...user, teams: userTeams};
          if (userHasRoleInOrganization(organization, organizationUser, RoleType.Read)) {
            const readableProjects = projects.filter(
              project =>
                project.organizationId === organization.id &&
                userHasRoleInProject(organization, project, organizationUser, RoleType.Read)
            );
            if (readableProjects.length) {
              const organizationWithProjects = {
                ...organization,
                projects: sortResourcesByOrder(readableProjects),
              };
              readableOrganizations.push(organizationWithProjects);
            }
          }
          if (userHasRoleInOrganization(organization, organizationUser, RoleType.ProjectContribute)) {
            contributeOrganizations.push(organization);
          }
        }
        return {
          organizationsWithProjects: sortResourcesByOrder(readableOrganizations),
          contributeOrganizations: sortResourcesByOrder(contributeOrganizations),
        };
      })
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}

type OrganizationWithProjects = Organization & {projects: Project[]};
