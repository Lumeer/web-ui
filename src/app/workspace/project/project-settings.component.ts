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

import {Component, ElementRef, OnInit, ViewChild, TemplateRef} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';
import {Project} from '../../core/dto/project';
import {ProjectService} from '../../core/rest/project.service';
import {HttpResponse} from '@angular/common/http';
import {CollectionService} from '../../core/rest/collection.service';
import {Collection} from '../../core/dto/collection';
import {NotificationsService} from 'angular2-notifications';
import {BsModalRef, BsModalService} from 'ngx-bootstrap';

@Component({
  templateUrl: './project-settings.component.html',
  styleUrls: ['./project-settings.component.scss']
})
export class ProjectSettingsComponent implements OnInit {
  public deleteConfirm: BsModalRef;
  private creation: boolean;
  public project: Project;
  private organizationCode: string;
  public projectCode: string;
  private originalProjectCode: string;
  public collectionsCount: number;
  public projectDescriptionEditable: boolean = false;

  @ViewChild('projectDescription')
  public projectDescription: ElementRef;
  private originalProjectName: string;

  constructor(private projectService: ProjectService,
              private route: ActivatedRoute,
              private router: Router,
              private collectionService: CollectionService,
              private notificationService: NotificationsService,
              private modalService: BsModalService) {
  }

  public ngOnInit(): void {
    this.project = new Project();
    this.route.data.subscribe((data: { creation: boolean }) => {
      this.creation = data.creation;
      this.retrieveParamsFromRoute();
    });
  }

  private retrieveParamsFromRoute() {
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.organizationCode = params.get('organizationCode');
      this.projectCode = params.get('projectCode');
      this.getProject();
      this.originalProjectCode = this.projectCode
    });
  }

  private getProject(): void {
    this.projectService.getProject(this.organizationCode, this.projectCode)
      .subscribe(
        (project: Project) => {
          this.project = project;
          this.getNumberOfCollections();
          this.originalProjectName =this.project.name;
        },
        error => {
          this.notificationService.error('Error', 'Error getting project');
        }
      )
    ;
  }

  public updateProject(): void {
    this.projectService.editProject(this.organizationCode, this.projectCode, this.project).subscribe(success => this.notificationService
        .success('Success', 'Project was successfully updated'),
      error => {
        this.notificationService.error('Error', 'Error updating project');
      });
  }

  public updateProjectName(): void {
    if (this.project.name === this.originalProjectName) {
      return;
    }
    this.projectService.editProject(this.organizationCode, this.projectCode, this.project)
      .subscribe(success => {
          this.notificationService
            .success('Success', 'Project\'s name was successfully updated');
          this.originalProjectName = this.project.name;
        },
        error => {
          this.notificationService.error('Error', 'Error updating project ');
        });
  }

  public updateProjectCode() {
    if (this.projectCode === this.originalProjectCode) {
      return;
    }
    this.projectService.editProject(this.organizationCode, this.originalProjectCode, this.project).subscribe((response: HttpResponse<Object>) => {
        this.originalProjectCode = this.project.code;
        this.projectCode = this.project.code;
        this.router.navigate([`/organization/${this.organizationCode}/project/${this.project.code}`]);
      },
      error => {
        this.notificationService.error('Error', 'Error updating project\'s code');
      },
      () => this.notificationService
        .success('Success', 'Project\'s code was successfully updated')
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
          this.notificationService.error('Error', 'An error occurred during deletion of the organization');
        }
      );
  }

  public getNumberOfCollections(): void {
    this.collectionService.getCollections().subscribe((collections: Collection[]) =>
      (this.collectionsCount = collections.length));
  }

  public onProjectDescriptionBlur(description: string) {
    this.projectDescriptionEditable = false;
  }

  public onProjectDescriptionEdit() {
    this.projectDescriptionEditable = true;
    setTimeout(() => {
      this.projectDescription.nativeElement.focus();
    }, 50);
  }

  public workspacePath(): string {
    return `/w/${this.organizationCode}/${this.project.code}`;
  }

  public initialized(): boolean {
    return !(this.project.code === '' && this.project.name === '' && this.project.icon === '' && this.project.color === '');
  }

  public confirmDeletion(modal: TemplateRef<any>): void {
    this.deleteConfirm = this.modalService.show(modal);
  }
}
