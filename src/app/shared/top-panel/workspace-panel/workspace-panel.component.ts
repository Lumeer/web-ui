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

import {ChangeDetectionStrategy, Component, ElementRef, Input, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs';
import {filter, map, mergeMap, take} from 'rxjs/operators';
import {Resource} from '../../../core/dto';
import {ResourceType} from '../../../core/model/resource-type';
import {NotificationService} from '../../../core/notifications/notification.service';
import {AppState} from '../../../core/store/app.state';
import {Workspace} from '../../../core/store/navigation/workspace.model';
import {OrganizationModel} from '../../../core/store/organizations/organization.model';
import {OrganizationsAction} from '../../../core/store/organizations/organizations.action';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {ProjectModel} from '../../../core/store/projects/project.model';
import {ProjectsAction} from '../../../core/store/projects/projects.action';
import {
  selectProjectByWorkspace,
  selectProjectsByOrganizationId,
  selectProjectsLoadedForOrganization,
} from '../../../core/store/projects/projects.state';
import {RouterAction} from '../../../core/store/router/router.action';
import {DialogService} from '../../../dialog/dialog.service';

@Component({
  selector: 'workspace-panel',
  templateUrl: './workspace-panel.component.html',
  styleUrls: ['./workspace-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacePanelComponent implements OnInit {
  @Input()
  public workspace: Workspace;

  public readonly organizationResourceType = ResourceType.Organization;
  public readonly projectResourceType = ResourceType.Project;

  public organization$: Observable<OrganizationModel>;
  public project$: Observable<ProjectModel>;

  constructor(
    private dialogService: DialogService,
    public element: ElementRef,
    private i18n: I18n,
    private notificationService: NotificationService,
    private router: Router,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.organization$ = this.store$.select(selectOrganizationByWorkspace);
    this.project$ = this.store$.select(selectProjectByWorkspace);
  }

  public goToProject(organization: OrganizationModel, project: ProjectModel) {
    if (organization && project) {
      this.store$.dispatch(new OrganizationsAction.Select({organizationId: organization.id}));
      this.store$.dispatch(new ProjectsAction.Select({projectId: project.id}));
      this.store$.dispatch(
        new RouterAction.Go({path: ['w', organization.code, project.code, 'view', 'search', 'all']})
      );
    }
  }

  public selectOrganization(organization: OrganizationModel): void {
    this.store$.dispatch(new ProjectsAction.Get({organizationId: organization.id}));
    this.store$.dispatch(new ProjectsAction.GetCodes({organizationId: organization.id}));

    this.store$
      .select(selectProjectsLoadedForOrganization(organization.id))
      .pipe(
        filter(loaded => loaded),
        mergeMap(() => this.store$.select(selectProjectsByOrganizationId(organization.id))),
        take(1),
        map(projects => (projects.length > 0 ? projects[0] : undefined))
      )
      .subscribe(project => {
        if (project) {
          this.goToProject(organization as OrganizationModel, project);
        } else {
          this.createNewProject(organization);
        }
      });
  }

  public selectProject(organization: OrganizationModel, project: Resource): void {
    this.goToProject(organization, project as ProjectModel);
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

    this.goToProject(organization, project);
  }
}
