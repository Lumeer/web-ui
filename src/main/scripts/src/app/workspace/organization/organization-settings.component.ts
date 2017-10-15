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

import {Component, OnInit, Output, EventEmitter, ViewChild, ElementRef} from '@angular/core';
import {ActivatedRoute, ParamMap, Router} from '@angular/router';

import {Organization} from '../../core/dto/organization';
import {WorkspaceService} from '../../core/workspace.service';
import {OrganizationService} from '../../core/rest/organization.service';
import {HttpResponse} from '@angular/common/http';
import {ProjectService} from '../../core/rest/project.service';
import {Project} from "../../core/dto/project";

@Component({
  templateUrl: './organization-settings.component.html',
  styleUrls: ['./organization-settings.component.scss']
})
export class OrganizationSettingsComponent implements OnInit {

  private organization: Organization;
  private organizationCode: string;
  private errorMessage: any;
  private originalOrganizationCode: string;
  private projectsCount: number;
  private organizationDescriptionEditable: boolean = false;

  @ViewChild('organizationDescription')
  public organizationDescription: ElementRef;

  constructor(private organizationService: OrganizationService,
              private workspaceService: WorkspaceService,
              private route: ActivatedRoute,
              private router: Router,
              private projectService: ProjectService) {
  }

  public ngOnInit(): void {
    this.organization = new Organization();
    this.route.paramMap.subscribe((params: ParamMap) => {
      this.organizationCode = params.get('organizationCode');
      if (this.organizationCode) {
        this.getOrganization();
      }
    });

  }

  private getOrganization(): void {
    this.organizationService.getOrganization(this.organizationCode)
      .subscribe((organization: Organization) => {
          this.originalOrganizationCode = organization.code;
          this.organization = organization;
          this.getNumberOfProjects();
        },
        error => this.errorMessage = error
      );
  }

  public updateOrganization(): void {
    this.organizationService.editOrganization(this.organizationCode, this.organization).subscribe();
  }

  public updateOrganizationCode(): void {

    this.organizationService.editOrganization(this.originalOrganizationCode, this.organization)
      .subscribe((response: HttpResponse<Object>) => {
        this.originalOrganizationCode = this.organization.code;
        this.organizationCode = this.organization.code;
        this.router.navigate([`/organization/${this.organization.code}`]);
        error => {
          return this.errorMessage = error;
        };
      });

  }

  private goBack(): void {
    this.router.navigate(['/workspace']);
  }

  public onDelete(): void {
    this.organizationService.deleteOrganization(this.organizationCode)
      .subscribe(
        text => this.goBack(),
        error => {
          return this.errorMessage = error;
        }
      );
  }

  public getNumberOfProjects(): void {
    this.projectService.getProjects(this.organizationCode).subscribe((projects: Project[]) =>
      (this.projectsCount = projects.length));
  }

  public onOrganizationDescriptionBlur(description: string) {
    this.organizationDescriptionEditable = false;
  }

  public onOrganizationDescriptionEdit() {
    this.organizationDescriptionEditable = true;
    setTimeout(() => {
      this.organizationDescription.nativeElement.focus();
    }, 50);
  }
}
