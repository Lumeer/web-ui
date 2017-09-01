/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';

import {Organization} from '../../core/dto/organization';
import {Project} from '../../core/dto/project';
import {WorkspaceService} from '../../core/workspace.service';
import {OrganizationService} from '../../core/rest/organization.service';
import {ProjectService} from '../../core/rest/project.service';
import {UserSettingsService} from '../../core/rest/user-settings.service';
import {PerfectScrollbarComponent} from 'ngx-perfect-scrollbar';

const squareSize: number = 170;

@Component({
  selector: 'workspace-chooser',
  templateUrl: './workspace-chooser.component.html',
  styleUrls: ['./workspace-chooser.component.scss']
})
export class WorkspaceChooserComponent implements OnInit {

  @ViewChild('organizationScrollbar')
  public organizationsElement: PerfectScrollbarComponent;

  @ViewChild('projectScrollbar')
  public projectsElement: PerfectScrollbarComponent;

  private organizationsWidth: number = 0;
  private projectsWidth: number = 0;
  private organizations: Organization[];
  private activeOrganization: Organization;
  private activeProject: Project;

  constructor(private organizationService: OrganizationService,
              private projectService: ProjectService,
              private workspaceService: WorkspaceService,
              private router: Router) {
  }

  public ngOnInit(): void {
    this.organizationService.getOrganizations()
      .subscribe(organizations => {
        this.organizations = organizations;
        this.organizationsWidth = (organizations.length + 1) * squareSize + 5;

        if (this.workspaceService.organizationCode) {
          const ix: number = this.organizations.findIndex(org =>
            org.code === this.workspaceService.organizationCode
          );
          if (ix >= 0) {
            this.activeOrganization = this.organizations[ix];
            this.activeOrganization.index = ix;
            this.activeOrganization.active = true;

            this.projectService.getProjects(this.activeOrganization.code)
              .subscribe((projects: Project[]) => {
                this.activeOrganization.projects = projects;
                this.projectsWidth = (projects.length + 1) * squareSize + 5;

                if (this.workspaceService.projectCode) {
                  const ixProj: number = this.activeOrganization.projects.findIndex(proj =>
                    proj.code === this.workspaceService.projectCode
                  );
                  if (ixProj >= 0) {
                    this.activeProject = this.activeOrganization.projects[ixProj];
                    this.activeProject.active = true;
                  }
                }
              });
          }
        }
      });
  }

  public onOrganizationSelected(organization: Organization, index: number): void {
    this.organizations.forEach((org: Organization) => org.active = false);
    organization.active = true;
    organization.index = index;
    if (organization.projects) {
      organization.projects.forEach((project: Project) => project.active = false);
      this.projectsWidth = (organization.projects.length + 1) * squareSize + 5;
    } else {
      this.projectService.getProjects(organization.code)
        .subscribe((projects: Project[]) => {
          organization.projects = projects;
          this.projectsWidth = (projects.length + 1 ) * squareSize + 5;
        });
    }
    this.activeOrganization = organization;
    this.activeProject = undefined;
  }

  public onProjectSelected(project: Project, index: number): void {
    this.activeOrganization.projects.forEach((oneProject: Project) => oneProject.active = false);
    project.active = true;
    project.index = index;
    this.activeProject = project;
  }

  public onScrollOrganizations(direction: number): void {
    this.organizationsElement.scrollToLeft(this.organizationsElement['elementRef'].nativeElement.scrollLeft + squareSize * direction);
  }

  public onScrollProjects(direction: number): void {
    this.projectsElement.scrollToLeft(this.projectsElement['elementRef'].nativeElement.scrollLeft + squareSize * direction);
  }

  public onSaveActiveItems(): void {
    if (this.activeOrganization && this.activeProject) {
      // TODO save settings on the server using configuration service
      this.workspaceService.organizationCode = this.activeOrganization.code;
      this.workspaceService.projectCode = this.activeProject.code;

      this.router.navigate(['w', this.activeOrganization.code, this.activeProject.code, 'collections']);
    }
  }

  public onCreateOrganization(): void {
    this.router.navigate(['organization', 'add']);
  }

  public onCreateProject(): void {
    if (this.activeOrganization) {
      this.router.navigate(['organization', this.activeOrganization.code, 'project', 'add']);
    }
  }

  public onOrganizationSettings(organization: Organization): void {
    this.router.navigate(['organization', organization.code]);
  }

  public onProjectSettings(project: Project): void {
    if (this.activeOrganization) {
      this.router.navigate(['organization', this.activeOrganization.code, 'project', project.code]);
    }
  }

}
