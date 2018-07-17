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

import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';

import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable, Subscription} from 'rxjs';
import {filter, map, take, tap} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {OrganizationModel} from '../../core/store/organizations/organization.model';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {selectProjectsForWorkspace} from '../../core/store/projects/projects.state';
import {selectAllUsers} from '../../core/store/users/users.state';
import {ResourceType} from '../../core/model/resource-type';
import {Location} from '@angular/common';
import {Perspective} from '../../view/perspectives/perspective';
import {ProjectModel} from '../../core/store/projects/project.model';
import {selectPreviousUrl} from '../../core/store/navigation/navigation.state';

@Component({
  templateUrl: './organization-settings.component.html'
})
export class OrganizationSettingsComponent implements OnInit, OnDestroy {

  public userCount$: Observable<number>;
  public projectsCount$: Observable<number>;
  public organization: OrganizationModel;

  private organizationSubscription: Subscription;
  private firstProject: ProjectModel = null;
  private previousUrl: string;

  constructor(private i18n: I18n,
              private router: Router,
              private store: Store<AppState>,
              private notificationService: NotificationService,
              private location: Location) {
  }

  public ngOnInit() {
    this.subscribeToStore();
  }

  public ngOnDestroy() {
    if (this.organizationSubscription) {
      this.organizationSubscription.unsubscribe();
    }
  }

  public getResourceType(): ResourceType {
    return ResourceType.Organization;
  }

  public onDelete() {
    const message = this.i18n({id: 'organization.delete.dialog.message', value: 'Organization is about to be permanently deleted.'});
    const title = this.i18n({id: 'organization.delete.dialog.title', value: 'Delete organization?'});
    const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
    const noButtonText = this.i18n({id: 'button.no', value: 'No'});

    this.notificationService.confirm(
      message,
      title,
      [
        {text: yesButtonText, action: () => this.deleteOrganization(), bold: false},
        {text: noButtonText}
      ]
    );
  }

  public onNewDescription(newDescription: string) {
    const organizationCopy = {...this.organization, description: newDescription};
    this.updateOrganization(organizationCopy);
  }

  public onNewName(name: string) {
    const organizationCopy = {...this.organization, name};
    this.updateOrganization(organizationCopy);
  }

  public onNewCode(code: string) {
    const organizationCopy = {...this.organization, code};
    this.updateOrganization(organizationCopy);
  }

  public onNewIcon(icon: string) {
    const organizationCopy = {...this.organization, icon};
    this.updateOrganization(organizationCopy);
  }

  public onNewColor(color: string) {
    const organizationCopy = {...this.organization, color};
    this.updateOrganization(organizationCopy);
  }

  public onProjectsClick() {
    this.goBack();
  }

  public goBack(): void {
    if (this.previousUrl && this.previousUrl !== '/') {
      const urls = this.previousUrl.split('?', 2);
      const params = this.router.parseUrl(this.previousUrl).queryParams;
      const queryParams = urls.length > 1 ? {queryParams: params} : undefined;
      this.router.navigate([urls[0]], queryParams);
    } else if (this.firstProject) {
      this.router.navigate(['w', this.organization.code, this.firstProject.code, 'view', Perspective.Search, 'all']);
    }
  }

  private subscribeToStore() {
    this.userCount$ = this.store.select(selectAllUsers)
      .pipe(map(users => users ? users.length : 0));

    this.projectsCount$ = this.store.select(selectProjectsForWorkspace)
      .pipe(tap(projects => {
        if (projects && projects.length > 0) {
          this.firstProject = projects[0];
        }
      }), map(projects => projects ? projects.length : 0));

    this.organizationSubscription = this.store.select(selectOrganizationByWorkspace)
      .pipe(filter(organization => !isNullOrUndefined(organization)))
      .subscribe(organization => this.organization = organization);

    this.store.select(selectPreviousUrl).pipe(take(1))
      .subscribe(url => this.previousUrl = url);
  }

  private deleteOrganization() {
    this.store.dispatch(new OrganizationsAction.Delete({organizationId: this.organization.id}));
    this.goBack();
  }

  private updateOrganization(organization: OrganizationModel) {
    this.store.dispatch(new OrganizationsAction.Update({organization}));
  }

}
