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
import {ActivatedRoute, ParamMap, Router} from '@angular/router';

import {Project} from '../../../core/dto/project';
import {WorkspaceService} from '../../../core/workspace.service';
import {ProjectService} from '../../../core/rest/project.service';
import {NotificationsService} from 'angular2-notifications';

@Component({
  selector: 'project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit {

  private creation: boolean;
  public project: Project;
  public organizationCode: string;
  public projectCode: string;

  constructor(private projectService: ProjectService,
              private workspaceService: WorkspaceService,
              private route: ActivatedRoute,
              private router: Router,
              private notificationsService:NotificationsService) {
  }

  public ngOnInit(): void {
    this.project = new Project();
    this.route.data.subscribe((data: { creation: boolean }) => {
      this.creation = data.creation;
      if (this.creation) {
        this.retrieveParamsFromRoute();
      } else {
        this.retrieveParamsFromParentRoute();
      }
    });
  }

  private retrieveParamsFromRoute() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.organizationCode = params.get('organizationCode');
    });
  }

  private retrieveParamsFromParentRoute() {
    this.route.parent.paramMap.subscribe((params: ParamMap) => {
      this.organizationCode = params.get('organizationCode');
      this.projectCode = params.get('projectCode');
      this.getProject();
    });
  }

  private getProject(): void {
    this.projectService.getProject(this.organizationCode, this.projectCode)
      .subscribe(
        (project: Project) => this.project = project,
        error => this.notificationsService.error('Error', 'Error getting the project')
      );
  }

  public onSave() {
    if (this.creation) {
      this.createProject();
    } else {
      this.updateProject();
    }
  }

  private createProject() {
    this.project.color = '#cccccc';
    this.project.icon = 'fa fa-exclamation-circle';
    this.projectService.createProject(this.organizationCode, this.project)
      .subscribe(
        response => this.goBack(),
        error => this.notificationsService.error('Error', 'Error creating the project')
      );
  }

  private updateProject() {
    this.projectService.editProject(this.organizationCode, this.projectCode, this.project)
      .subscribe(
        response => {
          if (this.projectCode === this.workspaceService.projectCode) {
            this.workspaceService.projectCode = this.project.code;
          }
          this.goBack();
        },
        error => this.notificationsService.error('Error', 'Error updating the project')
      );
  }

  public onCancel() {
    this.goBack();
  }

  public onDelete() {
    this.projectService.deleteProject(this.organizationCode, this.projectCode)
      .subscribe(
        response => this.goBack(),
        error => this.notificationsService.error('Error', 'Error deleting the organization')
      );
  }

  private goBack() {
    this.router.navigate(['/workspace']);
  }

}
