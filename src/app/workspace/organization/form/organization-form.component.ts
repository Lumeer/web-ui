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
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';

import {Organization} from '../../../core/dto/organization';
import {OrganizationService} from '../../../core/rest/organization.service';
import {NotificationService} from '../../../core/notifications/notification.service';
import {AppState} from '../../../core/store/app.state';
import {selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {Workspace} from '../../../core/store/navigation/workspace.model';

@Component({
  selector: 'organization-form',
  templateUrl: './organization-form.component.html',
  styleUrls: ['./organization-form.component.scss']
})
export class OrganizationFormComponent implements OnInit {

  public organization: Organization;
  public organizationCode: string;

  private workspace: Workspace;

  constructor(private organizationService: OrganizationService,
              private router: Router,
              private store: Store<AppState>,
              private notificationsService: NotificationService) {
  }

  public ngOnInit(): void {
    this.organization = new Organization();
    this.store.select(selectWorkspace).subscribe(workspace => {
      this.workspace = workspace;
      this.organizationCode = workspace.organizationCode;
      if (this.organizationCode) {
        this.getOrganization();
      }
    });
  }

  private getOrganization(): void {
    this.organizationService.getOrganization(this.organizationCode)
      .subscribe((organization: Organization) => this.organization = organization,
        error => this.notificationsService.error('Error getting the organization')
      );
  }

  public onSave() {
    if (this.organizationCode) {
      this.organizationService.editOrganization(this.organizationCode, this.organization)
        .subscribe(
          response => {
            if (this.organizationCode === this.workspace.organizationCode) {
              this.workspace.organizationCode = this.organization.code;
            }
            this.goBack();
          },
          error => this.notificationsService.error('Error saving the organization')
        );
    } else {
      this.organization.color = '#cccccc';
      this.organization.icon = 'fa fa-exclamation-circle';
      this.organizationService.createOrganization(this.organization)
        .subscribe(
          response => this.goBack(),
          error => this.notificationsService.error('Error creating the organization')
        );
    }
  }

  public onCancel() {
    this.goBack();
  }

  public onDelete() {
    this.organizationService.deleteOrganization(this.organizationCode)
      .subscribe(
        response => {
          this.goBack();
          this.notificationsService.success(`Organization ${this.organization.name} deleted`);
        },
        error => {
          this.notificationsService.error('Error deleting the organization');
        }
      );
  }

  private goBack() {
    this.router.navigate(['/workspace']);
  }

}
