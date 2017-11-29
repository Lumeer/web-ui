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

import {Project} from '../../../core/dto/project';
import {ProjectService} from '../../../core/rest/project.service';
import {NotificationService} from '../../../core/notifications/notification.service';
import {AppState} from '../../../core/store/app.state';
import {selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {Workspace} from '../../../core/store/navigation/workspace.model';

@Component({
  selector: 'project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit {

  public project: Project;
  public organizationCode: string;
  public projectCode: string;

  private workspace: Workspace;

  constructor(private projectService: ProjectService,
              private router: Router,
              private store: Store<AppState>,
              private notificationsService: NotificationService) {
  }

  public ngOnInit(): void {
    this.store.select(selectWorkspace).subscribe(workspace => this.workspace = workspace);

    this.project = new Project();
    this.store.select(selectWorkspace).subscribe(workspace => {
      this.organizationCode = workspace.organizationCode;
    });
  }

  private getProject(): void {
    this.projectService.getProject(this.organizationCode, this.projectCode)
      .subscribe(
        (project: Project) => this.project = project,
        error => this.notificationsService.error('Error getting the project')
      );
  }

  public onSave() {
    this.createProject();
  }

  private createProject() {
    this.project.color = '#cccccc';
    this.project.icon = 'fa fa-exclamation-circle';
    this.projectService.createProject(this.organizationCode, this.project)
      .subscribe(
        response => this.goBack(),
        error => this.notificationsService.error('Error creating the project')
      );
  }

  private updateProject() {
    this.projectService.editProject(this.organizationCode, this.projectCode, this.project)
      .subscribe(
        response => {
          if (this.projectCode === this.workspace.projectCode) {
            this.workspace.projectCode = this.project.code;
          }
          this.goBack();
        },
        error => this.notificationsService.error('Error updating the project')
      );
  }

  public onCancel() {
    this.goBack();
  }

  public onDelete() {
    this.projectService.deleteProject(this.organizationCode, this.projectCode)
      .subscribe(
        response => {
          this.goBack();
          this.notificationsService.success(`Project ${this.project.name} deleted`);
        },
        error => {
          this.notificationsService.error('Error deleting the project');
        }
      );
  }

  private goBack() {
    this.router.navigate(['/workspace']);
  }

}
