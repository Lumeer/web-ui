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
import {Injectable} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Observable, forkJoin} from 'rxjs';
import {first, map, mergeMap, skipWhile, tap} from 'rxjs/operators';

import {DashboardTab, filterDefaultDashboardTabs} from '../core/model/dashboard-tab';
import {RoleType} from '../core/model/role-type';
import {AppState} from '../core/store/app.state';
import {Collection} from '../core/store/collections/collection';
import {CollectionsAction} from '../core/store/collections/collections.action';
import {selectAllCollections, selectCollectionsLoaded} from '../core/store/collections/collections.state';
import {Organization} from '../core/store/organizations/organization';
import {Project} from '../core/store/projects/project';
import {User} from '../core/store/users/user';
import {DefaultViewConfig, View} from '../core/store/views/view';
import {ViewsAction} from '../core/store/views/views.action';
import {
  selectAllViews,
  selectDefaultViewConfig,
  selectDefaultViewConfigsLoaded,
  selectViewsLoaded,
} from '../core/store/views/views.state';
import {userHasRoleInResource, userPermissionsInProject} from '../shared/utils/permission.utils';
import {DEFAULT_PERSPECTIVE_ID, Perspective} from '../view/perspectives/perspective';

@Injectable()
export class ResourcesGuardService {
  constructor(private store$: Store<AppState>) {}

  public selectViewByCode$(organization: Organization, project: Project, code: string): Observable<View> {
    return this.selectViews$(organization, project).pipe(map(views => views.find(view => view.code === code)));
  }

  public selectViews$(organization: Organization, project: Project): Observable<View[]> {
    return this.store$.pipe(
      select(selectViewsLoaded),
      tap(loaded => {
        if (!loaded) {
          const workspace = {organizationId: organization.id, projectId: project.id};
          this.store$.dispatch(new ViewsAction.Get({workspace}));
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectAllViews))),
      first()
    );
  }

  public selectCollections$(organization: Organization, project: Project): Observable<Collection[]> {
    return this.store$.select(selectCollectionsLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          const workspace = {organizationId: organization.id, projectId: project.id};
          this.store$.dispatch(new CollectionsAction.Get({workspace}));
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectAllCollections))),
      first()
    );
  }

  public selectDefaultViewConfig$(organization: Organization, project: Project): Observable<DefaultViewConfig> {
    return this.store$.pipe(
      select(selectDefaultViewConfigsLoaded),
      tap(loaded => {
        if (!loaded) {
          const workspace = {organizationId: organization.id, projectId: project.id};
          this.store$.dispatch(new ViewsAction.GetDefaultConfigs({workspace}));
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectDefaultViewConfig(Perspective.Search, DEFAULT_PERSPECTIVE_ID)))),
      first()
    );
  }

  public selectDefaultSearchTabs(
    organization: Organization,
    project: Project,
    user: User
  ): Observable<{
    tabs: DashboardTab[];
    defaultViewConfig: DefaultViewConfig;
    views: View[];
    collections: Collection[];
  }> {
    return forkJoin([
      this.selectViews$(organization, project),
      this.selectCollections$(organization, project),
      this.selectDefaultViewConfig$(organization, project),
    ]).pipe(
      map(([views, collections, defaultViewConfig]) => {
        const readableCollectionsCount = collections.filter(collection =>
          userHasRoleInResource(organization, project, collection, user, RoleType.Read)
        ).length;
        const readableViewsCount = views.filter(view =>
          userHasRoleInResource(organization, project, view, user, RoleType.Read)
        ).length;
        const permissions = userPermissionsInProject(organization, project, user);

        const tabs = filterDefaultDashboardTabs(permissions, readableCollectionsCount, readableViewsCount);
        return {tabs, views, collections, defaultViewConfig};
      })
    );
  }
}
