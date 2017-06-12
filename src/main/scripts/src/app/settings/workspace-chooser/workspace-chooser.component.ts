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

import {Organization} from '../../shared/dto/organization';
import {Project} from '../../shared/dto/project';
import {WorkspaceService} from '../../core/workspace.service';
import {OrganizationService} from '../organization/organization.service';
import {ProjectService} from '../project/project.service';
import {UserSettingsService} from '../../core/user-settings.service';
import {UserSettings} from '../../shared/dto/user.settings';

const squareSize: number = 170;

@Component({
  selector: 'workspace-chooser',
  template: require('./workspace-chooser.component.html'),
  styles: [require('./workspace-chooser.component.scss').toString()]
})
export class WorkspaceChooserComponent implements OnInit {

  @ViewChild('orgs') public companiesEl: any;
  @ViewChild('projs') public projectsEl: any;

  private organizationsWidth: number = 0;
  private projectsWidth: number = 0;
  private organizations: Organization[];
  private activeOrganization: Organization;
  private activeProject: Project;

  constructor(private organizationService: OrganizationService,
              private projectService: ProjectService,
              private userSettingsService: UserSettingsService,
              private workspaceService: WorkspaceService,
              private router: Router) {
  }

  public ngOnInit(): void {
    this.organizationService.getOrganizations()
      .subscribe((organizations: Organization[]) => {
        this.organizations = organizations;
        this.organizationsWidth = (organizations.length + 1) * squareSize + 5;

        if (this.workspaceService.organizationCode) {
          let ix: number = this.organizations.findIndex(org =>
            org.code === this.workspaceService.organizationCode
          );
          if (ix) {
            this.activeOrganization = this.organizations[ix];
            this.activeOrganization.index = ix;
            this.activeOrganization.active = true;

            this.projectService.getProjects(this.activeOrganization.code)
              .subscribe((projects: Project[]) => {
                this.activeOrganization.projects = projects;
                this.projectsWidth = (projects.length + 1) * squareSize + 5;

                if (this.workspaceService.projectCode) {
                  let ixProj: number = this.activeOrganization.projects.findIndex(proj =>
                    proj.code === this.workspaceService.projectCode
                  );
                  if (ixProj) {
                    this.activeProject = this.activeOrganization.projects[ixProj];
                    this.activeProject.active = true;
                  }
                }
              });
          }
        }
      });
  }

  public onOrganizationSelected(organization: Organization, index: number) {
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

  public onProjectSelected(project: Project, index: number) {
    this.activeOrganization.projects.forEach((oneProject: Project) => oneProject.active = false);
    project.active = true;
    project.index = index;
    this.activeProject = project;
  }

  public onScrollOrganizations(toRight?: boolean) {
    if (toRight) {
      this.companiesEl.scrollToLeft(this.companiesEl.elementRef.nativeElement.scrollLeft + squareSize);
    } else {
      this.companiesEl.scrollToLeft(this.companiesEl.elementRef.nativeElement.scrollLeft - squareSize);
    }
  }

  public onScrollProjects(toRight?: boolean) {
    if (toRight) {
      this.projectsEl.scrollToLeft(this.projectsEl.elementRef.nativeElement.scrollLeft + squareSize);
    } else {
      this.projectsEl.scrollToLeft(this.projectsEl.elementRef.nativeElement.scrollLeft - squareSize);
    }
  }

  public onSaveActiveItems() {
    if (this.activeOrganization && this.activeProject) {
      this.userSettingsService.updateUserSettings(
        new UserSettings(this.activeOrganization.code, this.activeProject.code)
      ).subscribe(response => {
        if (response.ok) {
          this.workspaceService.organizationCode = this.activeOrganization.code;
          this.workspaceService.projectCode = this.activeProject.code;
        }
      });
    }
  }

  public onCreateOrganization() {
    this.router.navigate(['/organization']);
  }

  public onCreateProject() {
    if (this.activeOrganization) {
      this.router.navigate(['/organization/' + this.activeOrganization.code + '/project']);
    }
  }

  public onOrganizationSettings(organization: Organization) {
    this.router.navigate(['/organization/' + organization.code]);
  }

  public onProjectSettings(project: Project) {
    if (this.activeOrganization) {
      this.router.navigate(['/organization/' + this.activeOrganization.code + '/project/' + project.code]);
    }
  }

}
