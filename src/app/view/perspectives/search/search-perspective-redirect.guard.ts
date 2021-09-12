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
import {ActivatedRouteSnapshot, CanActivate, Params, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable, of} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectDefaultViewConfig, selectDefaultViewConfigsLoaded} from '../../../core/store/views/views.state';
import {DEFAULT_PERSPECTIVE_ID, Perspective} from '../perspective';
import {map, mergeMap, skipWhile, take, tap} from 'rxjs/operators';
import {parseSearchTabFromUrl} from '../../../core/store/navigation/search-tab';
import {DefaultViewConfig} from '../../../core/store/views/view';
import {ViewsAction} from '../../../core/store/views/views.action';
import {WorkspaceService} from '../../../workspace/workspace.service';
import {Organization} from '../../../core/store/organizations/organization';
import {Project} from '../../../core/store/projects/project';
import {addDefaultDashboardTabsIfNotPresent} from '../../../shared/utils/dashboard.utils';

@Injectable()
export class SearchPerspectiveRedirectGuard implements CanActivate {
  public constructor(
    private router: Router,
    private store$: Store<AppState>,
    private workspaceService: WorkspaceService
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const {organizationCode, projectCode, viewCode} = this.getParams(next);

    return this.workspaceService
      .selectOrGetWorkspace(organizationCode, projectCode)
      .pipe(
        mergeMap(({organization, project}) =>
          this.resolveSearchTab(organization, project, viewCode, next.queryParams, state.url)
        )
      );
  }

  private resolveSearchTab(
    organization: Organization,
    project: Project,
    viewCode: string,
    queryParams: Params,
    currentUrl: string
  ): Observable<any> {
    return this.selectDefaultViewConfig$(organization, project).pipe(
      take(1),
      map(defaultConfig => {
        const viewPath: any[] = ['/w', organization.code, project.code, 'view'];
        if (viewCode) {
          viewPath.push({vc: viewCode});
        }
        viewPath.push(Perspective.Search);

        let searchTab;
        const tabs = addDefaultDashboardTabsIfNotPresent(defaultConfig?.config?.search?.dashboard?.tabs);
        const desiredSearchTab = parseSearchTabFromUrl(currentUrl);
        const selectedTab = desiredSearchTab && tabs.find(tab => tab.id === desiredSearchTab);
        if (selectedTab) {
          searchTab = selectedTab.id;
        } else {
          searchTab = defaultConfig?.config?.search?.searchTab || tabs[0].id;
        }

        viewPath.push(searchTab);

        if (currentUrl === viewPath.join('/')) {
          return true;
        }

        return this.router.createUrlTree(viewPath, {queryParams});
      })
    );
  }

  private selectDefaultViewConfig$(organization: Organization, project: Project): Observable<DefaultViewConfig> {
    return this.store$.pipe(
      select(selectDefaultViewConfigsLoaded),
      tap(loaded => {
        if (!loaded) {
          const workspace = {organizationId: organization.id, projectId: project.id};
          this.store$.dispatch(new ViewsAction.GetDefaultConfigs({workspace}));
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectDefaultViewConfig(Perspective.Search, DEFAULT_PERSPECTIVE_ID))))
    );
  }

  private getParams(
    route: ActivatedRouteSnapshot
  ): {organizationCode?: string; projectCode?: string; viewCode?: string} {
    for (const path of route.pathFromRoot) {
      if (path.paramMap.has('organizationCode') && path.paramMap.has('projectCode')) {
        return {
          organizationCode: path.paramMap.get('organizationCode'),
          projectCode: path.paramMap.get('projectCode'),
          viewCode: path.paramMap.get('vc'),
        };
      }
    }
    return {};
  }
}
