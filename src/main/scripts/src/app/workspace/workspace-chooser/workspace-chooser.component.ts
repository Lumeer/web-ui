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
import {animate, keyframes, state, style, transition, trigger} from '@angular/animations';

import {Organization} from '../../core/dto/organization';
import {Project} from '../../core/dto/project';
import {WorkspaceService} from '../../core/workspace.service';
import {OrganizationService} from '../../core/rest/organization.service';
import {ProjectService} from '../../core/rest/project.service';
import {isNullOrUndefined} from 'util';
import {Role} from '../../shared/permissions/role';
import {UserSettingsService} from '../../core/user-settings.service';

const squareSize: number = 200;
const arrowSize: number = 40;

@Component({
  selector: 'workspace-chooser',
  templateUrl: './workspace-chooser.component.html',
  styleUrls: ['./workspace-chooser.component.scss'],
  animations: [
    trigger('animateOpacityFromUp', [
      state('in', style({transform: 'translateY(0)', opacity: 1})),
      transition('void => *', [
        animate(300, keyframes([
          style({transform: 'translateY(-50px)', opacity: 0, offset: 0}),
          style({transform: 'translateY(0)', opacity: 1, offset: 1})
        ]))
      ]),
      transition('* => void', [
        animate(300, keyframes([
          style({transform: 'translateY(0)', opacity: 1, offset: 0}),
          style({transform: 'translateY(-50px)', opacity: 0, offset: 1})
        ]))
      ])
    ])
  ]
})
export class WorkspaceChooserComponent implements OnInit {

  public organizations: Organization[] = [];
  public activeOrgIx: number;
  public activeProjIx: number;

  constructor(private organizationService: OrganizationService,
              private projectService: ProjectService,
              private userSettingsService: UserSettingsService,
              private workspaceService: WorkspaceService,
              private router: Router) {
  }

  public ngOnInit() {
    this.organizationService.getOrganizations()
      .subscribe(organizations => {
        this.organizations = organizations;

        if (this.workspaceService.organizationCode) {
          const ix: number = this.organizations.findIndex(org =>
            org.code === this.workspaceService.organizationCode
          );
          if (ix >= 0) {
            this.activeOrgIx = ix;

            const activeOrganization = this.organizations[this.activeOrgIx];
            activeOrganization.projects = [];
            this.projectService.getProjects(activeOrganization.code)
              .subscribe((projects: Project[]) => {
                activeOrganization.projects = projects;

                if (this.workspaceService.projectCode) {
                  const ixProj: number = activeOrganization.projects.findIndex(proj =>
                    proj.code === this.workspaceService.projectCode
                  );
                  if (ixProj >= 0) {
                    this.activeProjIx = ixProj;
                  }
                }
              });
          }
        }
      });
  }

  public onSelectOrganization(index: number) {
    const selectedOrganization = this.organizations[index];
    if (!selectedOrganization.projects) {
      selectedOrganization.projects = [];
      this.projectService.getProjects(selectedOrganization.code)
        .subscribe((projects: Project[]) => {
          selectedOrganization.projects = projects;
        });
    }
    this.activeOrganization = organization;
    this.activeProject = null;
  }

    this.activeProjIx = undefined;
    this.activeOrgIx = index;
  }

  public onCreateOrganization() {
    this.router.navigate(['organization', 'add']);
  }

  public onOrganizationSettings(index: number) {
    this.router.navigate(['organization', this.organizations[index].code]);
  }

  public onNewOrganizationDescription(description: string) {
    // TODO save for selected organization ix
  }

  public onSelectProject(index: number) {
    this.activeProjIx = index;
  }

  public onCreateProject() {
    if (!isNullOrUndefined(this.activeOrgIx)) {
      this.router.navigate(['organization', this.organizations[this.activeOrgIx].code, 'project', 'add']);
    }
  }

  public onProjectSettings(index: number) {
    if (!isNullOrUndefined(this.activeOrgIx)) {
      const project = this.organizations[this.activeOrgIx].projects[index];
      this.router.navigate(['organization', this.organizations[this.activeOrgIx].code, 'project', project.code]);
    }
  }

  public onNewProjectDescription(description: string) {
    // TODO save for selected project ix
  }

  public hasManageRole(organization: Organization) {
    return organization.permissions && organization.permissions.users.length === 1
      && organization.permissions.users[0].roles.some(r => r === Role.Manage.toString());
  }

  public onSaveActiveItems() {
    if (!isNullOrUndefined(this.activeOrgIx) && !isNullOrUndefined(this.activeProjIx)) {
      let activeOrgCode = this.organizations[this.activeOrgIx].code;
      let activeProjCode = this.organizations[this.activeOrgIx].projects[this.activeProjIx].code;

      this.workspaceService.organizationCode = activeOrgCode;
      this.workspaceService.projectCode = activeProjCode;

      this.updateDefaultWorkspace(activeOrgCode, activeProjCode);

      this.router.navigate(['w', activeOrgCode, activeProjCode, 'collections']);
    }
  }

  private updateDefaultWorkspace(organizationCode: string, projectCode: string) {
    let userSettings = this.userSettingsService.getUserSettings();
    userSettings.defaultOrganization = organizationCode;
    userSettings.defaultProject = projectCode;
    this.userSettingsService.updateUserSettings(userSettings);
  }
}
