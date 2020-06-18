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
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {filter, first, map, switchMap, tap} from 'rxjs/operators';
import {AppState} from './store/app.state';
import {Organization} from './store/organizations/organization';
import {OrganizationsAction} from './store/organizations/organizations.action';
import {selectAllOrganizations, selectOrganizationsLoaded} from './store/organizations/organizations.state';
import {Project} from './store/projects/project';
import {ProjectsAction} from './store/projects/projects.action';
import {selectAllProjects, selectProjectsLoaded} from './store/projects/projects.state';
import {DefaultWorkspace} from './store/users/user';
import {selectCurrentUser} from './store/users/users.state';
import {NotificationService} from './notifications/notification.service';
import {WorkspaceSelectService} from './service/workspace-select.service';
import {Perspective} from '../view/perspectives/perspective';
import {environment} from '../../environments/environment';
import {STORAGE_PUBLIC_VIEW} from './constants';
import {isNullOrUndefined} from '../shared/utils/common.utils';

@Component({
  template: '',
})
export class HomeComponent implements OnInit, OnDestroy {
  private subscriptions = new Subscription();

  public constructor(
    private router: Router,
    private notificationService: NotificationService,
    private selectService: WorkspaceSelectService,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    if (environment.publicView) {
      this.subscriptions.add(this.redirectToPublicWorkspace());
    } else {
      this.subscriptions.add(this.redirectToWorkspace());
    }
  }

  private redirectToPublicWorkspace(): Subscription {
    return this.getOrganizationsAndProjects().subscribe(({organizations, projects}) => {
      const organization = organizations[0];
      const project = projects[0];
      const viewCode = JSON.parse(localStorage.getItem(STORAGE_PUBLIC_VIEW)) || project?.templateMetadata?.defaultView;

      if (organization && project) {
        this.navigateToProject(organization, project, viewCode);
      } else {
        // TODO show some error page
      }
    });
  }

  private redirectToWorkspace(): Subscription {
    return combineLatest([this.getDefaultWorkspace(), this.getOrganizationsAndProjects()])
      .pipe(first())
      .subscribe(([workspace, {organizations, projects}]) => {
        if (organizations.length > 0 && projects.length > 0) {
          if (workspace) {
            this.navigateToWorkspaceProject(workspace, organizations, projects);
          } else {
            this.navigateToAnyProject(organizations, projects);
          }
        } else if (organizations.length === 0) {
          this.selectService.createNewOrganization({replaceUrl: true});
        } else {
          this.selectService.createNewProject(organizations[0], null, {replaceUrl: true});
        }
      });
  }

  private navigateToWorkspaceProject(workspace: DefaultWorkspace, organizations: Organization[], projects: Project[]) {
    const workspaceOrganization =
      workspace.organizationId && organizations.find(org => org.id === workspace.organizationId);
    const workspaceProject = workspace.projectId && projects.find(proj => proj.id === workspace.projectId);

    if (workspaceOrganization && workspaceProject) {
      this.navigateToProject(workspaceOrganization, workspaceProject);
    } else if (workspaceOrganization) {
      const project = projects.find(proj => proj.organizationId === workspaceOrganization.id);
      if (project) {
        this.navigateToProject(workspaceOrganization, project);
      } else {
        this.navigateToAnyProject(organizations, projects);
      }
    } else {
      this.navigateToAnyProject(organizations, projects);
    }
  }

  private navigateToAnyProject(organizations: Organization[], projects: Project[]) {
    const organization = organizations.find(org => projects.some(proj => proj.organizationId === org.id));
    if (organization) {
      const project = projects.find(proj => proj.organizationId === organization.id);
      if (project) {
        this.navigateToProject(organization, project);
      } else {
        this.selectService.createNewProject(organization, null, {replaceUrl: true});
      }
    } else {
      this.selectService.createNewOrganization({replaceUrl: true});
    }
  }

  private navigateToProject(organization: Organization, project: Project, viewCode?: string) {
    const path: any[] = ['/', 'w', organization.code, project.code, 'view'];
    if (viewCode) {
      path.push({vc: viewCode});
    } else {
      path.push(Perspective.Search);
    }
    this.router.navigate(path, {replaceUrl: true});
  }

  private getDefaultWorkspace(): Observable<DefaultWorkspace> {
    return this.store$.select(selectCurrentUser).pipe(
      filter(user => !!user),
      map(user => user.defaultWorkspace)
    );
  }

  private getOrganizations(): Observable<Organization[]> {
    return this.store$.select(selectOrganizationsLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new OrganizationsAction.Get());
        }
      }),
      filter(loaded => loaded),
      switchMap(() => this.store$.select(selectAllOrganizations))
    );
  }

  private getOrganizationsAndProjects(): Observable<{organizations: Organization[]; projects: Project[]}> {
    return combineLatest([
      this.getOrganizations().pipe(
        tap(organizations =>
          organizations.forEach(org => this.store$.dispatch(new ProjectsAction.Get({organizationId: org.id})))
        )
      ),
      this.store$.select(selectProjectsLoaded),
    ]).pipe(
      filter(([organizations, projectsLoaded]) => organizations.every(org => projectsLoaded[org.id])),
      switchMap(([organizations]) =>
        this.store$.select(selectAllProjects).pipe(map((projects: Project[]) => ({organizations, projects})))
      )
    );
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
