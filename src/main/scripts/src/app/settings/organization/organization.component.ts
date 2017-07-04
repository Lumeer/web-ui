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
import {OrganizationService} from './organization.service';
import {ActivatedRoute, Router} from '@angular/router';

import {Organization} from '../../shared/dto/organization';
import {WorkspaceService} from '../../core/workspace.service';

@Component({
  selector: 'organization',
  templateUrl: './organization.component.html',
  styleUrls: ['./organization.component.scss']
})
export class OrganizationComponent implements OnInit {

  private organization: Organization;
  private orgCode: string;
  private errorMessage: any;

  constructor(private organizationService: OrganizationService,
              private workspaceService: WorkspaceService,
              private route: ActivatedRoute,
              private router: Router) {
  }

  public ngOnInit(): void {
    this.organization = new Organization();
    this.route.params.subscribe(params => {
      this.orgCode = params['code'];
      if (this.orgCode) {
        this.organizationService.getOrganization(this.orgCode)
          .subscribe((organization: Organization) => this.organization = organization,
            error => this.errorMessage = error
          );
      }
    });
  }

  public onSave() {
    if (this.orgCode) {
      this.organizationService.editOrganization(this.orgCode, this.organization)
        .subscribe(
          response => {
            if (this.orgCode === this.workspaceService.organizationCode) {
              this.workspaceService.organizationCode = this.organization.code;
            }
            this.goBack();
          },
          error => this.errorMessage = error
        );
    } else {
      this.organizationService.createOrganization(this.organization)
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
    this.organizationService.deleteOrganization(this.orgCode)
      .subscribe(
        response => this.goBack(),
        error => this.errorMessage = error
      );
  }

  private goBack() {
    this.router.navigate(['/workspace']);
  }

}
