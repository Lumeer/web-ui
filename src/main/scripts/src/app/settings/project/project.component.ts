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
import {ProjectService} from './project.service';
import {ActivatedRoute, Router} from '@angular/router';

import {Project} from '../../shared/dto/project';
import {WorkspaceService} from '../../core/workspace.service';

@Component({
  selector: 'project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit {

  private project: Project;
  private orgCode: string;
  private projCode: string;
  private errorMessage: any;

  constructor(private projectService: ProjectService,
              private workspaceService: WorkspaceService,
              private route: ActivatedRoute,
              private router: Router) {
  }

  public ngOnInit(): void {
    this.project = new Project();
    this.route.params.subscribe(params => {
      this.orgCode = params['orgCode'];
      this.projCode = params['projCode'];
      if (this.projCode) {
        this.projectService.getProject(this.orgCode, this.projCode)
          .subscribe(
            (project: Project) => this.project = project,
            error => this.errorMessage = error
          );
      }
    });
  }

  public onSave() {
    if (this.projCode) {
      this.projectService.editProject(this.orgCode, this.projCode, this.project)
        .subscribe(
          response => {
            if (this.projCode === this.workspaceService.projectCode) {
              this.workspaceService.projectCode = this.project.code;
            }
            this.goBack();
          },
          error => this.errorMessage = error
        );
    } else {
      this.projectService.createProject(this.orgCode, this.project)
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
    this.projectService.deleteProject(this.orgCode, this.projCode)
      .subscribe(
        response => this.goBack(),
        error => this.errorMessage = error
      );
  }

  private goBack() {
    this.router.navigate(['/workspace']);
  }

}
