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

import {ChangeDetectionStrategy, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {UserNotification, UserNotificationType} from '../../../../core/model/user-notification';
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {
  selectAllUserNotifications,
  selectUnreadUserNotifications,
  selectUserNotificationsState,
} from '../../../../core/store/user-notifications/user-notifications.state';
import {UserNotificationsAction} from '../../../../core/store/user-notifications/user-notifications.action';
import {OrganizationModel} from '../../../../core/store/organizations/organization.model';
import {
  selectOrganizationById,
  selectOrganizationsDictionary,
} from '../../../../core/store/organizations/organizations.state';
import {Dictionary} from '@ngrx/entity';
import {Workspace} from '../../../../core/store/navigation/workspace.model';
import {selectUrl, selectWorkspace} from '../../../../core/store/navigation/navigation.state';
import {Perspective, perspectiveIconsMap} from '../../../../view/perspectives/perspective';
import {filter, take, withLatestFrom} from 'rxjs/operators';
import {Router} from '@angular/router';
import {convertQueryModelToString} from '../../../../core/store/navigation/query.converter';
import {ProjectModel} from '../../../../core/store/projects/project.model';
import {selectProjectByWorkspace} from '../../../../core/store/projects/projects.state';

@Component({
  selector: 'notifications-menu',
  templateUrl: './notifications-menu.component.html',
  styleUrls: ['./notifications-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsMenuComponent implements OnInit {
  public notifications$: Observable<UserNotification[]>;
  public unreadNotifications$: Observable<UserNotification[]>;

  public unreadOnly = false;

  public perspectiveIcons = perspectiveIconsMap;

  @ViewChild('organizationShared')
  private organizationSharedTemplate: TemplateRef<any>;

  @ViewChild('projectShared')
  private projectSharedTemplate: TemplateRef<any>;

  @ViewChild('collectionShared')
  private collectionSharedTemplate: TemplateRef<any>;

  @ViewChild('viewShared')
  private viewSharedTemplate: TemplateRef<any>;

  @ViewChild('unknown')
  private unknownTemplate: TemplateRef<any>;

  public organizations$: Observable<Dictionary<OrganizationModel>>;

  public currentWorkspace$: Observable<Workspace>;

  public currentProject$: Observable<ProjectModel>;

  // need to include the notification loader service here for it to initially load notifications and to do that just once
  constructor(private store: Store<AppState>, private router: Router) {}

  public ngOnInit(): void {
    this.subscribeToNotifications();
    this.subscribeToResources();

    this.store
      .pipe(
        select(selectUserNotificationsState),
        filter(state => !state.loaded),
        take(1)
      )
      .subscribe(state => this.store.dispatch(new UserNotificationsAction.Get()));
  }

  private subscribeToNotifications(): void {
    this.notifications$ = this.store.pipe(select(selectAllUserNotifications));
    this.unreadNotifications$ = this.store.pipe(select(selectUnreadUserNotifications));
  }

  private subscribeToResources(): void {
    this.organizations$ = this.store.pipe(select(selectOrganizationsDictionary));
    this.currentWorkspace$ = this.store.pipe(select(selectWorkspace));
    this.currentProject$ = this.store.pipe(select(selectProjectByWorkspace));
  }

  public setNotificationReadEvent($event: MouseEvent, notification: UserNotification, read: boolean): void {
    $event.stopPropagation();
    this.setNotificationRead(notification, read);
  }

  private setNotificationRead(notification: UserNotification, read: boolean): void {
    notification.read = read;
    this.store.dispatch(new UserNotificationsAction.Update({userNotification: notification}));
  }

  public toggleUnreadFilter($event: MouseEvent): void {
    $event.stopPropagation();
    this.unreadOnly = !this.unreadOnly;
  }

  public getTemplate(type: UserNotificationType): TemplateRef<any> {
    switch (type) {
      case UserNotificationType.OrganizationShared:
        return this.organizationSharedTemplate;
      case UserNotificationType.ProjectShared:
        return this.projectSharedTemplate;
      case UserNotificationType.CollectionShared:
        return this.collectionSharedTemplate;
      case UserNotificationType.ViewShared:
        return this.viewSharedTemplate;
      default:
        return this.unknownTemplate;
    }
  }

  public navigateToTarget(userNotification: UserNotification): void {
    this.setNotificationRead(userNotification, true);

    switch (userNotification.type) {
      case UserNotificationType.OrganizationShared:
        this.store
          .pipe(
            select(selectOrganizationById(userNotification.organizationId)),
            filter(organization => !!organization.code),
            withLatestFrom(this.store.pipe(select(selectUrl))),
            take(1)
          )
          .subscribe(([organization, url]) => {
            const path = ['w', organization.code];
            if (!url.startsWith(this.router.createUrlTree(path).toString())) {
              this.router.navigate(path);
            }
          });
        return;
      case UserNotificationType.ProjectShared:
        this.store
          .pipe(
            select(selectOrganizationById(userNotification.organizationId)),
            filter(organization => !!organization.code),
            withLatestFrom(this.store.pipe(select(selectUrl))),
            take(1)
          )
          .subscribe(([organization, url]) => {
            const path = ['w', organization.code, userNotification.projectCode];
            if (userNotification.projectCode && !url.startsWith(this.router.createUrlTree(path).toString())) {
              this.router.navigate(path);
            }
          });
        return;
      case UserNotificationType.CollectionShared:
        this.store
          .pipe(
            select(selectOrganizationById(userNotification.organizationId)),
            filter(organization => !!organization.code),
            withLatestFrom(this.store.pipe(select(selectUrl))),
            take(1)
          )
          .subscribe(([organization, url]) => {
            const path = ['w', organization.code, userNotification.projectCode, 'view', Perspective.Table];
            const query = convertQueryModelToString({stems: [{collectionId: userNotification.collectionId}]});
            if (
              userNotification.projectCode &&
              userNotification.collectionId &&
              !url.startsWith(this.router.createUrlTree(path, {queryParams: {query}}).toString())
            ) {
              this.router.navigate(path, {queryParams: {query}});
            }
          });
        return;
      case UserNotificationType.ViewShared:
        this.store
          .pipe(
            select(selectOrganizationById(userNotification.organizationId)),
            filter(organization => !!organization.code),
            withLatestFrom(this.store.pipe(select(selectUrl))),
            take(1)
          )
          .subscribe(([organization, url]) => {
            const path = [
              'w',
              organization.code,
              userNotification.projectCode,
              'view',
              {vc: userNotification.viewCode},
            ];
            if (
              userNotification.projectCode &&
              userNotification.viewCode &&
              !url.startsWith(this.router.createUrlTree(path).toString())
            ) {
              this.router.navigate(path);
            }
          });
        return;
    }
  }
}
