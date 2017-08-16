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
import {ActivatedRoute, ParamMap, Router} from '@angular/router';

import {Organization} from '../../../core/dto/organization';
import {WorkspaceService} from '../../../core/workspace.service';
import {OrganizationService} from '../../../core/rest/organization.service';

@Component({
  selector: 'organization-form',
  templateUrl: './organization-form.component.html',
  styleUrls: ['./organization-form.component.scss']
})
export class OrganizationFormComponent implements OnInit {

  private organization: Organization;
  private organizationCode: string;
  private errorMessage: any;

  constructor(private organizationService: OrganizationService,
              private workspaceService: WorkspaceService,
              private route: ActivatedRoute,
              private router: Router) {
  }

  public ngOnInit(): void {
    this.organization = new Organization();

    this.route.paramMap.subscribe((params: ParamMap) => {
      this.organizationCode = params.get('organizationCode');
      if (this.organizationCode) {
        this.getOrganization();
      } else {
        if (this.route.parent != null) {
          this.route.parent.paramMap.subscribe((params: ParamMap) => {
            this.organizationCode = params.get('organizationCode');
            if (this.organizationCode) {
              this.getOrganization();
            }
          });
        }
      }
    });
  }

  public getOrganization(): void {
    this.organizationService.getOrganization(this.organizationCode)
      .subscribe((organization: Organization) => this.organization = organization,
        error => this.errorMessage = error
      );
  }

  public onSave() {
    if (this.organizationCode) {
      this.organizationService.editOrganization(this.organizationCode, this.organization)
        .subscribe(
          response => {
            if (this.organizationCode === this.workspaceService.organizationCode) {
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
    this.organizationService.deleteOrganization(this.organizationCode)
      .subscribe(
        response => this.goBack(),
        error => this.errorMessage = error
      );
  }

  private goBack() {
    this.router.navigate(['/workspace']);
  }

}
