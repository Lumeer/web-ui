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

import {filter, switchMap, take, takeUntil} from 'rxjs/operators';
import {NotificationService} from '../../core/notifications/notification.service';
import {AppState} from '../../core/store/app.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {
  selectNavigatingToOtherWorkspace,
  selectPreviousUrl,
  selectPreviousWorkspaceUrl,
  selectWorkspace,
} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace';
import {replaceWorkspacePathInUrl} from '../../shared/utils/data.utils';
import {AllowedPermissions} from '../../core/model/allowed-permissions';
import {selectLinkTypePermissions} from '../../core/store/user-permissions/user-permissions.state';
import {getLastUrlPart} from '../../shared/utils/common.utils';
import {LinkType} from '../../core/store/link-types/link.type';
import {
  selectAllLinkTypes,
  selectLinkTypeByWorkspaceWithCollections,
} from '../../core/store/link-types/link-types.state';

@Component({
  selector: 'link-type-settings',
  templateUrl: './link-type-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkTypeSettingsComponent implements OnInit, OnDestroy {
  public linkType$ = new BehaviorSubject<LinkType>(null);
  public permissions$: Observable<AllowedPermissions>;
  public allLinkTypes$: Observable<LinkType[]>;

  private workspace: Workspace;
  private previousUrl: string;

  private subscriptions = new Subscription();

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    private store$: Store<AppState>,
    private route: ActivatedRoute
  ) {}

  public ngOnInit() {
    this.subscribeToStore();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public onBack() {
    this.store$.dispatch(
      new NavigationAction.NavigateToPreviousUrl({
        previousUrl: replaceWorkspacePathInUrl(this.previousUrl, this.workspace),
        organizationCode: this.workspace.organizationCode,
        projectCode: this.workspace.projectCode,
      })
    );
  }

  private subscribeToStore() {
    const sub1 = this.store$
      .pipe(
        select(selectWorkspace),
        filter(workspace => !!workspace)
      )
      .subscribe(workspace => (this.workspace = workspace));
    this.subscriptions.add(sub1);

    const sub2 = this.store$
      .pipe(
        select(selectLinkTypeByWorkspaceWithCollections),
        filter(linkType => !!linkType)
      )
      .subscribe(linkType => this.linkType$.next({...linkType}));
    this.subscriptions.add(sub2);

    this.permissions$ = this.linkType$.pipe(
      filter(linkType => !!linkType),
      switchMap(linkType => this.store$.pipe(select(selectLinkTypePermissions(linkType.id))))
    );

    const sub3 = this.permissions$
      .pipe(
        takeUntil(
          this.store$.pipe(
            select(selectNavigatingToOtherWorkspace),
            filter(navigating => navigating)
          )
        )
      )
      .subscribe(permissions => this.checkCurrentTab(permissions));
    this.subscriptions.add(sub3);

    this.store$.pipe(select(selectPreviousUrl), take(1)).subscribe(url => (this.previousUrl = url));

    this.allLinkTypes$ = this.store$.pipe(select(selectAllLinkTypes));
  }

  private checkCurrentTab(permissions: AllowedPermissions) {
    const currentTab = getLastUrlPart(this.router.url);
    if (this.isInTabWithoutPermissions(permissions, currentTab)) {
      this.navigateToAnyTab(permissions);
    }
  }

  private isInTabWithoutPermissions(permissions: AllowedPermissions, tab: string) {
    switch (tab) {
      case 'attributes':
        return !permissions?.roles?.AttributeEdit;
      case 'rules':
        return !permissions?.roles?.TechConfig;
      case 'activity':
        return !permissions?.roles?.Manage;
      default:
        return false;
    }
  }

  private navigateToAnyTab(permissions: AllowedPermissions) {
    if (permissions?.roles?.TechConfig) {
      this.router.navigate(['purpose'], {relativeTo: this.route});
    } else if (permissions?.roles?.AttributeEdit) {
      this.router.navigate(['attributes'], {relativeTo: this.route});
    } else {
      this.onBack();
    }
  }
}
