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

import {ChangeDetectionStrategy, Component, OnDestroy, OnInit} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {filter, map, mergeMap, take, tap, withLatestFrom} from 'rxjs/operators';
import {ResourceType} from '../../core/model/resource-type';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {selectPreviousUrl} from '../../core/store/navigation/navigation.state';
import {Organization} from '../../core/store/organizations/organization';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {
  selectOrganizationByWorkspace,
  selectOrganizationCodes,
} from '../../core/store/organizations/organizations.state';
import {Project} from '../../core/store/projects/project';
import {selectProjectsForWorkspace} from '../../core/store/projects/projects.state';
import {selectAllUsers} from '../../core/store/users/users.state';
import {Router} from '@angular/router';

@Component({
  templateUrl: './organization-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationSettingsComponent implements OnInit, OnDestroy {
  public userCount$: Observable<number>;
  public projectsCount$: Observable<number>;
  public organizationCodes$: Observable<string[]>;
  public organization$ = new BehaviorSubject<Organization>(null);

  public readonly organizationType = ResourceType.Organization;

  private firstProject: Project = null;
  private previousUrl: string;

  private subscriptions = new Subscription();

  constructor(
    private i18n: I18n,
    private router: Router,
    private store$: Store<AppState>,
    private notificationService: NotificationService
  ) {}

  public ngOnInit() {
    this.subscribeToStore();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onDelete() {
    const message = this.i18n({
      id: 'organization.delete.dialog.message',
      value: 'Do you really want to permanently delete this organization?',
    });
    const title = this.i18n({id: 'organization.delete.dialog.title', value: 'Delete organization?'});
    const yesButtonText = this.i18n({id: 'button.yes', value: 'Yes'});
    const noButtonText = this.i18n({id: 'button.no', value: 'No'});

    this.notificationService.confirm(message, title, [
      {text: noButtonText},
      {text: yesButtonText, action: () => this.deleteOrganization(), bold: false},
    ]);
  }

  public onNewDescription(newDescription: string) {
    const organizationCopy = {...this.organization$.getValue(), description: newDescription};
    this.updateOrganization(organizationCopy);
  }

  public onNewName(name: string) {
    const organizationCopy = {...this.organization$.getValue(), name};
    this.updateOrganization(organizationCopy);
  }

  public onNewCode(code: string) {
    const organizationCopy = {...this.organization$.getValue(), code};
    this.updateOrganization(organizationCopy);
  }

  public onNewIcon(icon: string) {
    const organizationCopy = {...this.organization$.getValue(), icon};
    this.updateOrganization(organizationCopy);
  }

  public onNewColor(color: string) {
    const organizationCopy = {...this.organization$.getValue(), color};
    this.updateOrganization(organizationCopy);
  }

  public onProjectsClick() {
    this.goBack();
  }

  public goBack() {
    this.store$.dispatch(
      new NavigationAction.NavigateToPreviousUrl({
        previousUrl: this.previousUrl,
        organizationCode: this.organization$.getValue().code,
        projectCode: this.firstProject ? this.firstProject.code : null,
      })
    );
  }

  private subscribeToStore() {
    this.userCount$ = this.store$.pipe(
      select(selectAllUsers),
      map(users => (users ? users.length : 0))
    );

    this.projectsCount$ = this.store$.pipe(
      select(selectProjectsForWorkspace),
      tap(projects => {
        if (projects && projects.length > 0) {
          this.firstProject = projects[0];
        }
      }),
      map(projects => (projects ? projects.length : 0))
    );

    this.subscriptions.add(
      this.store$
        .pipe(
          select(selectOrganizationByWorkspace),
          filter(organization => !!organization)
        )
        .subscribe(organization => this.organization$.next(organization))
    );

    this.subscriptions.add(
      this.store$
        .pipe(
          select(selectPreviousUrl),
          take(1)
        )
        .subscribe(url => (this.previousUrl = url))
    );

    this.store$.dispatch(new OrganizationsAction.GetCodes());
    this.organizationCodes$ = this.store$.pipe(
      select(selectOrganizationCodes),
      mergeMap(codes =>
        this.store$.pipe(select(selectOrganizationByWorkspace)).pipe(
          filter(organization => !!organization),
          map(organization => ({codes, organization}))
        )
      ),
      map(({codes, organization}) => (codes && codes.filter(code => code !== organization.code)) || [])
    );
  }

  private deleteOrganization() {
    this.store$.dispatch(
      new OrganizationsAction.Delete({
        organizationId: this.organization$.getValue().id,
        onSuccess: () => this.router.navigate(['/']),
      })
    );
  }

  private updateOrganization(organization: Organization) {
    this.store$.dispatch(new OrganizationsAction.Update({organization}));
  }
}
