/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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
import {ActivatedRoute, Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {filter, map, mergeMap, take, takeUntil, tap} from 'rxjs/operators';
import {ResourceType} from '../../core/model/resource-type';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {
  selectNavigatingToOtherWorkspace,
  selectPreviousWorkspaceUrl,
  selectWorkspace,
} from '../../core/store/navigation/navigation.state';
import {Organization} from '../../core/store/organizations/organization';
import {OrganizationsAction} from '../../core/store/organizations/organizations.action';
import {
  selectOrganizationByWorkspace,
  selectOrganizationCodes,
} from '../../core/store/organizations/organizations.state';
import {Project} from '../../core/store/projects/project';
import {selectProjectsForWorkspace} from '../../core/store/projects/projects.state';
import {selectAllUsers} from '../../core/store/users/users.state';
import {replaceWorkspacePathInUrl} from '../../shared/utils/data.utils';
import {Workspace} from '../../core/store/navigation/workspace';
import {AllowedPermissions} from '../../core/model/allowed-permissions';
import {selectOrganizationPermissions} from '../../core/store/user-permissions/user-permissions.state';
import {getLastUrlPart} from '../../shared/utils/common.utils';

@Component({
  templateUrl: './organization-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrganizationSettingsComponent implements OnInit, OnDestroy {
  public userCount$: Observable<number>;
  public projectsCount$: Observable<number>;
  public permissions$: Observable<AllowedPermissions>;
  public organizationCodes$: Observable<string[]>;
  public organization$ = new BehaviorSubject<Organization>(null);

  public readonly organizationType = ResourceType.Organization;

  private firstProject: Project = null;
  private previousUrl: string;
  private workspace: Workspace;
  private subscriptions = new Subscription();

  constructor(
    private router: Router,
    private route: ActivatedRoute,
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
    const message = $localize`:@@organization.delete.dialog.message:Do you really want to permanently delete this organization?`;
    const title = $localize`:@@organization.delete.dialog.title:Delete organization?`;
    this.notificationService.confirmYesOrNo(message, title, 'danger', () => this.deleteOrganization());
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

  public onNewColorOrIcon(event: {color: string; icon: string}) {
    const {color, icon} = event;
    const collection = {...this.organization$.getValue(), color, icon};
    this.updateOrganization(collection);
  }

  public goBack() {
    this.store$.dispatch(
      new NavigationAction.NavigateToPreviousUrl({
        previousUrl: replaceWorkspacePathInUrl(this.previousUrl, this.workspace),
        organizationCode: this.organization$.getValue().code,
        projectCode: this.firstProject?.code,
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
        .subscribe(organization => this.organization$.next({...organization}))
    );
    this.permissions$ = this.store$.pipe(select(selectOrganizationPermissions));

    this.subscriptions.add(
      this.permissions$
        .pipe(
          takeUntil(
            this.store$.pipe(
              select(selectNavigatingToOtherWorkspace),
              filter(navigating => navigating)
            )
          )
        )
        .subscribe(permissions => this.checkCurrentTab(permissions))
    );

    this.subscriptions.add(
      this.store$.pipe(select(selectPreviousWorkspaceUrl), take(1)).subscribe(url => (this.previousUrl = url))
    );

    this.subscriptions.add(
      this.store$
        .pipe(
          select(selectWorkspace),
          filter(workspace => !!workspace)
        )
        .subscribe(workspace => (this.workspace = workspace))
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

  private checkCurrentTab(permissions: AllowedPermissions) {
    const currentTab = getLastUrlPart(this.router.url);
    if (this.isInTabWithoutPermissions(permissions, currentTab)) {
      this.navigateToAnyTab(permissions);
    }
  }

  private isInTabWithoutPermissions(permissions: AllowedPermissions, tab: string) {
    switch (tab) {
      case 'detail':
        return !permissions?.roles?.Manage;
      case 'users':
      case 'teams':
        return !permissions?.roles?.UserConfig;
      default:
        return false;
    }
  }

  private navigateToAnyTab(permissions: AllowedPermissions) {
    if (permissions?.roles?.Manage) {
      this.router.navigate(['detail'], {relativeTo: this.route});
    } else if (permissions?.roles?.UserConfig) {
      this.router.navigate(['users'], {relativeTo: this.route});
    } else {
      this.goBack();
    }
  }

  private deleteOrganization() {
    this.store$.dispatch(new OrganizationsAction.Delete({organizationId: this.organization$.getValue().id}));
  }

  private updateOrganization(organization: Organization) {
    this.store$.dispatch(new OrganizationsAction.Update({organization}));
  }
}
