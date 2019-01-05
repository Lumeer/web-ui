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
import {
  CollectionSharedUserNotification,
  OrganizationSharedUserNotification,
  ProjectSharedUserNotification,
  UserNotification,
  UserNotificationType,
  ViewSharedUserNotification,
} from '../../../../core/model/user-notification';
import {BehaviorSubject, Observable, Subscription} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {
  selectAllUserNotifications,
  selectUnreadUserNotifications,
} from '../../../../core/store/user-notifications/user-notifications.state';
import {UserNotificationsAction} from '../../../../core/store/user-notifications/user-notifications.action';
import {Organization} from '../../../../core/store/organizations/organization';
import {
  selectOrganizationById,
  selectOrganizationsDictionary,
} from '../../../../core/store/organizations/organizations.state';
import {Dictionary} from '@ngrx/entity';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {selectUrl, selectWorkspace} from '../../../../core/store/navigation/navigation.state';
import {map, take} from 'rxjs/operators';
import {Router} from '@angular/router';
import {convertQueryModelToString} from '../../../../core/store/navigation/query.converter';
import {Project} from '../../../../core/store/projects/project';
import {selectProjectByWorkspace} from '../../../../core/store/projects/projects.state';
import {ValidNotificationFilterPipe} from './valid-notification-filter.pipe';
import {selectWorkspaceModels} from '../../../../core/store/common/common.selectors';
import {Perspective} from '../../../../view/perspectives/perspective';
import {WorkspaceSelectService} from '../../../../core/service/workspace-select.service';

@Component({
  selector: 'notifications-menu',
  templateUrl: './notifications-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsMenuComponent implements OnInit, OnDestroy {
  public notifications$: Observable<UserNotification[]>;
  public unreadNotifications$: Observable<UserNotification[]>;
  public unreadOnly$ = new BehaviorSubject(false);
  public organizations$: Observable<Dictionary<Organization>>;
  public currentWorkspace$: Observable<Workspace>;
  public currentProject$: Observable<Project>;

  private subscriptions = new Subscription();
  private currentOrganization: Organization;
  private currentProject: Project;
  private currentUrl: string;

  constructor(
    private store$: Store<AppState>,
    private router: Router,
    private selectService: WorkspaceSelectService,
    private validNotificationFilter: ValidNotificationFilterPipe
  ) {}

  public ngOnInit(): void {
    this.subscribeToNotifications();
    this.subscribeToResources();
    this.subscribeData();

    this.store$.dispatch(new UserNotificationsAction.Get());
  }

  private subscribeToNotifications() {
    this.notifications$ = this.store$.pipe(
      select(selectAllUserNotifications),
      map(notifications => this.validNotificationFilter.transform(notifications))
    );
    this.unreadNotifications$ = this.store$.pipe(
      select(selectUnreadUserNotifications),
      map(notifications => this.validNotificationFilter.transform(notifications))
    );
  }

  private subscribeToResources() {
    this.organizations$ = this.store$.pipe(select(selectOrganizationsDictionary));
    this.currentWorkspace$ = this.store$.pipe(select(selectWorkspace));
    this.currentProject$ = this.store$.pipe(select(selectProjectByWorkspace));
  }

  private subscribeData() {
    this.subscriptions.add(
      this.store$.pipe(select(selectWorkspaceModels)).subscribe(models => {
        this.currentOrganization = models.organization;
        this.currentProject = models.project;
      })
    );

    this.subscriptions.add(this.store$.pipe(select(selectUrl)).subscribe(url => (this.currentUrl = url)));
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public setNotificationReadEvent(data: {notification: UserNotification; read: boolean}) {
    this.setNotificationRead(data.notification, data.read);
  }

  private setNotificationRead(notification: UserNotification, read: boolean) {
    const userNotification = {...notification, read};
    this.store$.dispatch(new UserNotificationsAction.Update({userNotification}));
  }

  public toggleUnreadFilter() {
    const unreadOnly = this.unreadOnly$.getValue();
    this.unreadOnly$.next(!unreadOnly);
  }

  public navigateToTarget(notification: UserNotification) {
    this.setNotificationRead(notification, true);

    switch (notification.type) {
      case UserNotificationType.OrganizationShared:
        return this.navigateToOrganization(notification);
      case UserNotificationType.ProjectShared:
        return this.navigateToProject(notification);
      case UserNotificationType.CollectionShared:
        return this.navigateToCollection(notification);
      case UserNotificationType.ViewShared:
        return this.navigateToView(notification);
    }
  }

  private navigateToOrganization(notification: OrganizationSharedUserNotification) {
    if (!this.isCurrentOrganization(notification.organizationId)) {
      this.getOrganization(notification.organizationId, organization => {
        this.selectService.selectOrganization(organization);
      });
    }
  }

  private isCurrentOrganization(organizationId: string): boolean {
    return this.currentOrganization && this.currentOrganization.id === organizationId;
  }

  private navigateToProject(notification: ProjectSharedUserNotification) {
    if (!this.isCurrentWorkspace(notification.organizationId, notification.projectId)) {
      this.getOrganization(notification.organizationId, organization => {
        const path = ['w', organization.code, notification.projectCode, 'view', 'search', 'all'];
        this.router.navigate(path);
      });
    }
  }

  private isCurrentWorkspace(organizationId: string, projectId: string): boolean {
    return this.isCurrentOrganization(organizationId) && this.currentProject && this.currentProject.id === projectId;
  }

  private navigateToCollection(notification: CollectionSharedUserNotification) {
    this.getOrganization(notification.organizationId, organization => {
      const query = convertQueryModelToString({stems: [{collectionId: notification.collectionId}]});
      const path = ['w', organization.code, notification.projectCode, 'view', Perspective.Table];

      if (this.isCurrentWorkspace(notification.organizationId, notification.projectId)) {
        const buildUrl = this.router.createUrlTree(path, {queryParams: {query}}).toString();
        if (!this.startsWithCurrentUrl(buildUrl)) {
          this.router.navigate(path, {queryParams: {query}});
        }
      } else {
        this.router.navigate(path, {queryParams: {query}});
      }
    });
  }

  private startsWithCurrentUrl(url: string): boolean {
    return this.currentUrl && this.currentUrl.startsWith(url);
  }

  private getOrganization(id: string, action: (Organization) => void) {
    this.store$
      .pipe(
        select(selectOrganizationById(id)),
        take(1)
      )
      .subscribe(organization => action(organization));
  }

  private navigateToView(notification: ViewSharedUserNotification) {
    this.getOrganization(notification.organizationId, organization => {
      const path = ['w', organization.code, notification.projectCode, 'view', {vc: notification.viewCode}];

      if (this.isCurrentWorkspace(notification.organizationId, notification.projectId)) {
        const buildUrl = this.router.createUrlTree(path).toString();
        if (!this.startsWithCurrentUrl(buildUrl)) {
          this.router.navigate(path);
        }
      } else {
        this.router.navigate(path);
      }
    });
  }

  public deleteNotification(notification: UserNotification) {
    this.store$.dispatch(new UserNotificationsAction.Delete({id: notification.id}));
  }
}
