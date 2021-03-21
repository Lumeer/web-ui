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

import {ChangeDetectionStrategy, Component, ElementRef, Input, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {ResourceType} from '../../../core/model/resource-type';
import {AppState} from '../../../core/store/app.state';
import {Workspace} from '../../../core/store/navigation/workspace';
import {Organization} from '../../../core/store/organizations/organization';
import {
  selectAllOrganizations,
  selectOrganizationByWorkspace,
} from '../../../core/store/organizations/organizations.state';
import {Project} from '../../../core/store/projects/project';
import {selectProjectByWorkspace, selectProjectsForWorkspace} from '../../../core/store/projects/projects.state';
import {WorkspaceSelectService} from '../../../core/service/workspace-select.service';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Component({
  selector: 'workspace-panel',
  templateUrl: './workspace-panel.component.html',
  styleUrls: ['./workspace-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspacePanelComponent implements OnInit {
  @Input()
  public workspace: Workspace;

  @Input()
  public contentHeight: number;

  public readonly showDropdowns: boolean;
  public readonly organizationResourceType = ResourceType.Organization;
  public readonly projectResourceType = ResourceType.Project;

  public organization$: Observable<Organization>;
  public project$: Observable<Project>;
  public organizations$: Observable<Organization[]>;
  public projects$: Observable<Project[]>;

  constructor(
    public element: ElementRef<HTMLElement>,
    private router: Router,
    private selectService: WorkspaceSelectService,
    private store$: Store<AppState>,
    private configurationService: ConfigurationService
  ) {
    this.showDropdowns = !this.configurationService.getConfiguration().publicView;
  }

  public ngOnInit() {
    this.organization$ = this.store$.pipe(select(selectOrganizationByWorkspace));
    this.project$ = this.store$.pipe(select(selectProjectByWorkspace));
    this.organizations$ = this.store$.pipe(select(selectAllOrganizations));
    this.projects$ = this.store$.pipe(select(selectProjectsForWorkspace));
  }

  public selectOrganization(organization: Organization) {
    this.selectService.selectOrganization(organization);
  }

  public selectProject(organization: Organization, project: Project) {
    this.selectService.selectProject(organization, project);
  }

  public createNewOrganization() {
    this.selectService.createNewOrganization();
  }

  public createNewProject(organization: Organization) {
    this.selectService.createNewProject([organization]);
  }
}
