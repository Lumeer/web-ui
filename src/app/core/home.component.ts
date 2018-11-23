/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {combineLatest, Observable, Subscription} from 'rxjs';
import {filter, first, map, switchMap, tap} from 'rxjs/operators';
import {AppState} from './store/app.state';
import {OrganizationModel} from './store/organizations/organization.model';
import {OrganizationsAction} from './store/organizations/organizations.action';
import {selectAllOrganizations, selectOrganizationsLoaded} from './store/organizations/organizations.state';
import {ProjectModel} from './store/projects/project.model';
import {ProjectsAction} from './store/projects/projects.action';
import {selectAllProjects, selectProjectsLoaded} from './store/projects/projects.state';
import {DefaultWorkspaceModel} from './store/users/user.model';
import {selectCurrentUser} from './store/users/users.state';
import {DialogService} from '../dialog/dialog.service';
import {NotificationService} from './notifications/notification.service';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {PusherService} from './pusher/pusher.service';

@Component({
  template: '',
})
export class HomeComponent implements OnInit {
  public constructor(
    private router: Router,
    private dialogService: DialogService,
    private i18n: I18n,
    private notificationService: NotificationService,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.redirectToWorkspace();
  }

  private redirectToWorkspace(): Subscription {
    return combineLatest(this.getDefaultWorkspace(), this.getOrganizationsAndProjects())
      .pipe(first())
      .subscribe(([workspace, {organizations, projects}]) => {
        if (organizations.length > 0 && projects.length > 0) {
          if (workspace) {
            this.navigateToWorkspaceProject(workspace, organizations, projects);
          } else {
            this.navigateToAnyProject(organizations, projects);
          }
        } else if (organizations.length === 0) {
          this.createNewOrganization();
        } else {
          this.createNewProject(organizations[0]);
        }
      });
  }

  private navigateToWorkspaceProject(
    workspace: DefaultWorkspaceModel,
    organizations: OrganizationModel[],
    projects: ProjectModel[]
  ) {
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

  private navigateToAnyProject(organizations: OrganizationModel[], projects: ProjectModel[]) {
    const organization = organizations.find(org => projects.some(proj => proj.organizationId === org.id));
    if (organization) {
      const project = projects.find(proj => proj.organizationId === organization.id);
      if (project) {
        this.navigateToProject(organization, project);
      } else {
        this.createNewProject(organization);
      }
    } else {
      this.createNewOrganization();
    }
  }

  private navigateToProject(organization: OrganizationModel, project: ProjectModel) {
    this.router.navigate(['/', 'w', organization.code, project.code, 'view', 'search']);
  }

  private getDefaultWorkspace(): Observable<DefaultWorkspaceModel> {
    return this.store$.select(selectCurrentUser).pipe(
      filter(user => !!user),
      map(user => user.defaultWorkspace)
    );
  }

  private getOrganizations(): Observable<OrganizationModel[]> {
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

  private getOrganizationsAndProjects(): Observable<{organizations: OrganizationModel[]; projects: ProjectModel[]}> {
    return combineLatest(
      this.getOrganizations().pipe(
        tap(organizations =>
          organizations.forEach(org => this.store$.dispatch(new ProjectsAction.Get({organizationId: org.id})))
        )
      ),
      this.store$.select(selectProjectsLoaded)
    ).pipe(
      filter(([organizations, projectsLoaded]) => organizations.every(org => projectsLoaded[org.id])),
      switchMap(([organizations]) =>
        this.store$.select(selectAllProjects).pipe(map((projects: ProjectModel[]) => ({organizations, projects})))
      )
    );
  }

  public createNewOrganization(): void {
    this.dialogService.openCreateOrganizationDialog(organization => this.onCreateOrganization(organization));
  }

  public createNewProject(parentOrganization: OrganizationModel): void {
    this.dialogService.openCreateProjectDialog(parentOrganization.id, project =>
      this.onCreateProject(parentOrganization, project)
    );
  }

  private onCreateOrganization(organization: OrganizationModel) {
    const successMessage = this.i18n({
      id: 'organization.create.success',
      value: 'Organization was successfully created',
    });

    this.notificationService.success(successMessage);
    this.createNewProject(organization);
  }

  private onCreateProject(organization: OrganizationModel, project: ProjectModel) {
    const successMessage = this.i18n({
      id: 'project.create.success',
      value: 'Project was successfully created',
    });

    this.notificationService.success(successMessage);
    this.dialogService.closeDialog();
    this.navigateToProject(organization, project);
  }
}
