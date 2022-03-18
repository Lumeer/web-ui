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

import {Component, ChangeDetectionStrategy, OnInit, OnDestroy} from '@angular/core';
import {select, Store} from '@ngrx/store';
import {Subscription} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {ResourceType} from '../../core/model/resource-type';
import {Workspace} from '../../core/store/navigation/workspace';
import {ActivatedRoute, Router} from '@angular/router';
import {AppState} from '../../core/store/app.state';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {replaceWorkspacePathInUrl} from '../../shared/utils/data.utils';
import {selectNavigatingToOtherWorkspace, selectWorkspace} from '../../core/store/navigation/navigation.state';
import {selectProjectPermissions} from '../../core/store/user-permissions/user-permissions.state';
import {AllowedPermissions} from '../../core/model/allowed-permissions';
import {getLastUrlPart} from '../../shared/utils/common.utils';

@Component({
  templateUrl: './project-user.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectUserComponent implements OnInit, OnDestroy {
  public readonly type = ResourceType.Project;

  private previousUrl: string;
  private workspace: Workspace;
  private subscriptions = new Subscription();

  constructor(private router: Router, private store$: Store<AppState>, private route: ActivatedRoute) {}

  public ngOnInit() {
    this.subscribeToStore();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public goBack() {
    this.store$.dispatch(
      new NavigationAction.NavigateToPreviousUrl({
        previousUrl: replaceWorkspacePathInUrl(this.previousUrl, this.workspace),
        organizationCode: this.workspace?.organizationCode,
        projectCode: this.workspace?.projectCode,
      })
    );
  }

  private subscribeToStore() {
    this.subscriptions.add(
      this.store$.pipe(select(selectWorkspace)).subscribe(workspace => (this.workspace = workspace))
    );

    this.subscriptions.add(
      this.store$
        .pipe(
          select(selectProjectPermissions),
          takeUntil(
            this.store$.pipe(
              select(selectNavigatingToOtherWorkspace),
              filter(navigating => navigating)
            )
          )
        )
        .subscribe(permissions => this.checkCurrentTab(permissions))
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
      case 'activity':
        return !permissions?.roles?.Manage;
      case 'resources':
        return !permissions?.roles?.UserConfig;
      default:
        return false;
    }
  }

  private navigateToAnyTab(permissions: AllowedPermissions) {
    if (permissions?.roles?.Manage) {
      this.router.navigate(['activity'], {relativeTo: this.route});
    } else if (permissions?.roles?.UserConfig) {
      this.router.navigate(['resources'], {relativeTo: this.route});
    } else {
      this.goBack();
    }
  }
}
