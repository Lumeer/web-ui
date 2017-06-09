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
import {ActivatedRoute} from '@angular/router';
import {Location} from '@angular/common';

import {Project} from '../../shared/dto/project';

@Component({
  selector: 'project',
  template: require('./project.component.html'),
  styles: [require('./project.component.scss').toString()]
})
export class ProjectComponent implements OnInit {

  private project: Project;
  private orgCode: string;
  private projCode: string;

  constructor(private projectService: ProjectService,
              private route: ActivatedRoute,
              private location: Location) {
  }

  public ngOnInit(): void {
    this.project = new Project();
    this.route.params.subscribe(params => {
      this.orgCode = params['orgCode'];
      this.projCode = params['projCode'];
      if (this.projCode) {
        this.projectService.getProject(this.orgCode, this.projCode)
          .subscribe((project: Project) => this.project = project);
      }
    });
  }

  public onSave() {
    if (this.projCode) {
      this.projectService.editProject(this.orgCode, this.projCode, this.project)
        .subscribe(response => {
          if (response.ok) {
            this.location.back();
          }
        });
    } else {
      this.projectService.createProject(this.orgCode, this.project)
        .subscribe(response => {
          if (response.ok) {
            this.location.back();
          }
        });
    }
  }

  public onCancel() {
    this.location.back();
  }

  public onDelete() {
    this.projectService.deleteProject(this.orgCode, this.projCode)
      .subscribe(response => {
        if (response.ok) {
          this.location.back();
        }
      });
  }

}
