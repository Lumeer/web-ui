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
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs';
import {filter, map, mergeMap, take} from 'rxjs/operators';
import {ResourceType} from '../../../core/model/resource-type';
import {AppState} from '../../../core/store/app.state';
import {Workspace} from '../../../core/store/navigation/workspace';
import {Organization} from '../../../core/store/organizations/organization';
import {selectOrganizationByWorkspace} from '../../../core/store/organizations/organizations.state';
import {Project} from '../../../core/store/projects/project';
import {ProjectsAction} from '../../../core/store/projects/projects.action';
import {
  selectProjectByWorkspace,
  selectProjectsByOrganizationId,
  selectProjectsLoadedForOrganization,
} from '../../../core/store/projects/projects.state';
import {DialogService} from '../../../dialog/dialog.service';
import {RouterAction} from '../../../core/store/router/router.action';

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

  public organization$: Observable<Organization>;
  public project$: Observable<Project>;

  constructor(
    private dialogService: DialogService,
    public element: ElementRef,
    private i18n: I18n,
    private router: Router,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.organization$ = this.store$.pipe(select(selectOrganizationByWorkspace));
    this.project$ = this.store$.pipe(select(selectProjectByWorkspace));
  }

  public selectOrganization(organization: Organization) {
    this.store$.dispatch(new ProjectsAction.Get({organizationId: organization.id}));
    this.store$.dispatch(new ProjectsAction.GetCodes({organizationId: organization.id}));

    this.store$
      .pipe(
        select(selectProjectsLoadedForOrganization(organization.id)),
        filter(loaded => loaded),
        mergeMap(() => this.store$.pipe(select(selectProjectsByOrganizationId(organization.id)))),
        take(1),
        map(projects => (projects.length > 0 ? projects[0] : undefined))
      )
      .subscribe(project => {
        if (project) {
          this.goToProject(organization as Organization, project);
        } else {
          this.createNewProject(organization);
        }
      });
  }

  private goToProject(organization: Organization, project: Project) {
    if (organization && project) {
      const nextAction = new RouterAction.Go({path: ['w', organization.code, project.code, 'view', 'search', 'all']});
      this.store$.dispatch(
        new ProjectsAction.SwitchWorkspace({organizationId: organization.id, projectId: project.id, nextAction})
      );
    }
  }

  public selectProject(organization: Organization, project: Project) {
    this.goToProject(organization, project);
  }

  public createNewOrganization(): void {
    this.dialogService.openCreateOrganizationDialog(organization => this.onCreateOrganization(organization));
  }

  public createNewProject(parentOrganization: Organization) {
    this.dialogService.openCreateProjectDialog(parentOrganization.id, project =>
      this.onCreateProject(parentOrganization, project)
    );
  }

  private onCreateOrganization(organization: Organization) {
    this.createNewProject(organization);
  }

  private onCreateProject(organization: Organization, project: Project) {
    this.goToProject(organization, project);
  }
}
