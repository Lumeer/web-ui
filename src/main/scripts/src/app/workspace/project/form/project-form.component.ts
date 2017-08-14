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

import {Component, OnInit} from '@angular/core';
import {ProjectService} from '../../../core/rest/project.service';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';

import {Project} from '../../../core/dto/project';
import {WorkspaceService} from '../../../core/workspace.service';

@Component({
  selector: 'project-form',
  templateUrl: './project-form.component.html',
  styleUrls: ['./project-form.component.scss']
})
export class ProjectFormComponent implements OnInit {

  private project: Project;
  private organizationCode: string;
  private projectCode: string;
  private errorMessage: any;

  constructor(private projectService: ProjectService,
              private workspaceService: WorkspaceService,
              private route: ActivatedRoute,
              private router: Router) {
  }

  public ngOnInit(): void {
    this.project = new Project();
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.organizationCode = params.get('organizationCode');
      this.projectCode = params.get('projectCode');
      if (this.projectCode) {
        this.projectService.getProject(this.organizationCode, this.projectCode)
          .subscribe(
            (project: Project) => this.project = project,
            error => this.errorMessage = error
          );
      }
    });
  }

  public onSave() {
    if (this.projectCode) {
      this.projectService.editProject(this.organizationCode, this.projectCode, this.project)
        .subscribe(
          response => {
            if (this.projectCode === this.workspaceService.projectCode) {
              this.workspaceService.projectCode = this.project.code;
            }
            this.goBack();
          },
          error => this.errorMessage = error
        );
    } else {
      this.projectService.createProject(this.organizationCode, this.project)
        .subscribe(
          response => this.goBack(),
          error => this.errorMessage = error
        );
    }
  }

  public onCancel() {
    this.goBack();
  }

  public onDelete() {
    this.projectService.deleteProject(this.organizationCode, this.projectCode)
      .subscribe(
        response => this.goBack(),
        error => this.errorMessage = error
      );
  }

  private goBack() {
    this.router.navigate(['/workspace']);
  }

}
