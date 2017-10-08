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
    this.route.parent.paramMap.subscribe((params: ParamMap) => {
      this.organizationCode = params.get('organizationCode');
      if (this.organizationCode) {
        this.getOrganization();
      }
    });
  }

  private getOrganization(): void {
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
