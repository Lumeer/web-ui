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

import {Organization} from '../../core/dto/organization';
import {OrganizationService} from '../../core/rest/organization.service';
import {ProjectService} from '../../core/rest/project.service';
import {Project} from '../../core/dto/project';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';

@Component({
  templateUrl: './organization-settings.component.html',
  styleUrls: ['./organization-settings.component.scss']
})
export class OrganizationSettingsComponent implements OnInit {

  public originalOrganizationName: string;
  public organization: Organization;
  public organizationCode: string;
  private originalOrganizationCode: string;
  public projectsCount: number;

  @ViewChild('organizationDescription')
  public organizationDescription: ElementRef;

  constructor(private organizationService: OrganizationService,
              private router: Router,
              private store: Store<AppState>,
              private projectService: ProjectService,
              private notificationService: NotificationService) {
  }

  public ngOnInit(): void {
    this.organization = new Organization();
    this.store.select(selectWorkspace).subscribe(workspace => {
        this.organizationCode = workspace.organizationCode;
        if (this.organizationCode) {
          this.getOrganization();
        }
      },
      error => {
        this.notificationService.error('Error loading organization');
      }
    );
  }

  private getOrganization(): void {
    this.organizationService.getOrganization(this.organizationCode)
      .subscribe((organization: Organization) => {
          this.originalOrganizationCode = organization.code;
          this.organization = organization;
          this.getNumberOfProjects();
          this.originalOrganizationName = this.organization.name;
        },
        error => {
          this.notificationService.error('Error getting the organization');
        }
      );
  }

  public updateOrganization(): void {
    this.organizationService.editOrganization(this.organizationCode, this.organization)
      .subscribe(success => null,
        error => {
          this.notificationService.error('Error updating organization');
        });
  }

  public updateOrganizationName(): void {
    if (this.organization.name === this.originalOrganizationName) {
      return;
    }
    this.organizationService.editOrganization(this.organizationCode, this.organization)
      .subscribe(success => {
          this.notificationService.success(`Organization's name was successfully updated`);
          this.originalOrganizationName = this.organization.name;
        },
        error => {
          this.notificationService.error('Error updating organization');
        });
  }

  public updateOrganizationCode(): void {
    if (this.organizationCode === this.originalOrganizationCode) {
      return;
    }
    this.organizationService.editOrganization(this.originalOrganizationCode, this.organization)
      .subscribe((response) => {
          this.notificationService.success('Organization\'s code was successfully updated');
          this.originalOrganizationCode = this.organization.code;
          this.organizationCode = this.organization.code;
          this.router.navigate(['/organization', this.organization.code]);
        },
        error => {
          this.notificationService.error('Error editing the organization');
        }
      );
  }

  private goBack(): void {
    this.router.navigate(['/workspace']);
  }

  public onDelete(): void {
    this.organizationService.deleteOrganization(this.organizationCode)
      .subscribe(
        text => this.goBack(),
        error => {
          this.notificationService.error('An error occurred during deletion of the organization');
        }
      );
  }

  public delete(): void {
    this.onDelete();
  }

  public getNumberOfProjects(): void {
    this.projectService.getProjects(this.organizationCode).subscribe((projects: Project[]) => (this.projectsCount = projects.length));
  }

  public initialized(): boolean {
    return !(this.organization.code === '' && this.organization.name === '' && this.organization.icon === '' && this.organization.color === '');
  }

  public confirmDeletion(): void {
    this.notificationService.confirm(
      'Deleting an organization will permanently remove it.',
      'Delete Organization?',
      [
        {text: 'Yes', action: () => this.onDelete(), bold: false},
        {text: 'No'}
      ]
    );
  }

}
