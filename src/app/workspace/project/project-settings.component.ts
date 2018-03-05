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

import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';

import {Collection, Project} from '../../core/dto';
import {CollectionService, ProjectService} from '../../core/rest';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {filter} from 'rxjs/operators';

@Component({
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.scss']
})
export class ProjectSettingsComponent implements OnInit {

  public project: Project;
  private organizationCode: string;
  public projectCode: string;
  private originalProjectCode: string;
  public collectionsCount: number;

  @ViewChild('projectDescription')
  public projectDescription: ElementRef;
  private originalProjectName: string;

  constructor(private projectService: ProjectService,
              private router: Router,
              private store: Store<AppState>,
              private collectionService: CollectionService,
              private notificationService: NotificationService) {
  }

  public ngOnInit(): void {
    this.store.select(selectWorkspace).pipe(
      filter(workspace => !!(workspace.organizationCode && workspace.projectCode))
    ).subscribe(workspace => {
      this.organizationCode = workspace.organizationCode;
      this.projectCode = workspace.projectCode;
      this.getProject();
      this.originalProjectCode = this.projectCode;
    });
  }

  private getProject(): void {
    this.projectService.getProject(this.organizationCode, this.projectCode)
      .subscribe(
        (project: Project) => {
          this.project = project;
          this.getNumberOfCollections();
          this.originalProjectName = this.project.name;
        },
        error => {
          this.notificationService.error('Error getting project');
        }
      )
    ;
  }

  public updateProject(): void {
    this.projectService.editProject(this.organizationCode, this.projectCode, this.project).subscribe(
      success => null,
      error => {
        this.notificationService.error('Error updating project');
      });
  }

  public updateProjectName(): void {
    if (this.project.name === this.originalProjectName) {
      return;
    }
    this.projectService.editProject(this.organizationCode, this.projectCode, this.project)
      .subscribe(success => {
          this.notificationService.success('Project\'s name was successfully updated');
          this.originalProjectName = this.project.name;
        },
        error => {
          this.notificationService.error('Error updating project');
        });
  }

  public updateProjectCode() {
    if (this.projectCode === this.originalProjectCode) {
      return;
    }
    this.projectService.editProject(this.organizationCode, this.originalProjectCode, this.project).subscribe(
      (response) => {
        this.notificationService.success('Project\'s code was successfully updated');
        this.originalProjectCode = this.project.code;
        this.projectCode = this.project.code;
        this.router.navigate(['/organization', this.organizationCode, 'project', this.project.code]);
      },
      error => {
        this.notificationService.error('Error updating project\'s code');
      }
    );
  }

  private goBack(): void {
    this.router.navigate(['/workspace']);
  }

  public onDelete(): void {
    this.projectService.deleteProject(this.organizationCode, this.projectCode)
      .subscribe(
        text => this.goBack(),
        error => {
          this.notificationService.error('An error occurred during deletion of the organization');
        }
      );
  }

  public getNumberOfCollections(): void {
    this.collectionService.getCollections().subscribe((collections: Collection[]) =>
      (this.collectionsCount = collections.length));
  }

  public workspacePath(): string {
    return `/w/${this.organizationCode}/${this.project.code}`;
  }

  public initialized(): boolean {
    return !(this.project.code === '' && this.project.name === '' && this.project.icon === '' && this.project.color === '');
  }

  public confirmDeletion(): void {
    this.notificationService.confirm(
      'Deleting an project will permanently remove it.',
      'Delete Project?',
      [
        {text: 'Yes', action: () => this.onDelete(), bold: false},
        {text: 'No'}
      ]
    );
  }
}
