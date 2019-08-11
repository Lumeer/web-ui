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

import {ChangeDetectionStrategy, Component, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';
import {filter, map, mergeMap, tap} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {Organization} from '../../core/store/organizations/organization';
import {Permission} from '../../core/store/permissions/permissions';
import {User} from '../../core/store/users/user';
import {selectAllUsers, selectCurrentUser} from '../../core/store/users/users.state';
import {View} from '../../core/store/views/view';
import {ViewsAction} from '../../core/store/views/views.action';
import {selectViewByCode} from '../../core/store/views/views.state';
import {Project} from '../../core/store/projects/project';
import {selectWorkspaceModels} from '../../core/store/common/common.selectors';
import {Angulartics2} from 'angulartics2';
import {environment} from '../../../environments/environment';
import mixpanel from 'mixpanel-browser';
import {selectOrganizationByWorkspace} from '../../core/store/organizations/organizations.state';
import {selectProjectByWorkspace} from '../../core/store/projects/projects.state';
import {userCanReadWorkspace} from '../../shared/utils/resource.utils';
import {ShareViewDialogBodyComponent} from './body/share-view-dialog-body.component';

@Component({
  selector: 'share-view-dialog',
  templateUrl: './share-view-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareViewDialogComponent implements OnInit {
  @ViewChild(ShareViewDialogBodyComponent, {static: true})
  public shareViewDialogBody: ShareViewDialogBodyComponent;

  public currentUser$: Observable<User>;
  public organization$: Observable<Organization>;
  public project$: Observable<Project>;
  public view$: Observable<View>;
  public users$: Observable<User[]>;

  public submitDisabled$ = new BehaviorSubject(true);

  private view: View;

  public constructor(
    private i18n: I18n,
    private route: ActivatedRoute,
    private store$: Store<AppState>,
    private angulartics2: Angulartics2
  ) {}

  public ngOnInit() {
    this.organization$ = this.store$.pipe(select(selectOrganizationByWorkspace));
    this.project$ = this.store$.pipe(select(selectProjectByWorkspace));
    this.currentUser$ = this.store$.pipe(select(selectCurrentUser));
    this.users$ = this.store$.pipe(select(selectAllUsers));
    this.view$ = this.bindView();
  }

  private bindView(): Observable<View> {
    return this.route.paramMap.pipe(
      map(params => params.get('viewCode')),
      filter(viewCode => !!viewCode),
      mergeMap(viewCode => this.store$.pipe(select(selectViewByCode(viewCode)))),
      tap(view => (this.view = view))
    );
  }

  public share() {
    this.shareViewDialogBody.onSubmit();
  }

  public onShare(data: {permissions: Permission[]; newUsers: User[]; newUsersRoles: Record<string, string[]>}) {
    this.store$.dispatch(
      new ViewsAction.SetUserPermissions({
        viewId: this.view.id,
        ...data,
      })
    );

    if (environment.analytics) {
      this.angulartics2.eventTrack.next({
        action: 'View share',
        properties: {
          category: 'Collaboration',
          label: 'view',
          value: this.view.id,
        },
      });

      if (environment.mixpanelKey) {
        mixpanel.track('View Shared', {view: this.view.id});
      }
    }
  }

  public onRolesChanged(changed: boolean) {
    this.submitDisabled$.next(!changed);
  }
}
