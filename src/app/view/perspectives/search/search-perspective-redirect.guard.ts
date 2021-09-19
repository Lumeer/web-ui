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
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Params,
  Router,
  RouterStateSnapshot,
  UrlSerializer,
  UrlTree,
} from '@angular/router';
import {combineLatest, Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {
  selectDefaultSearchPerspectiveTabs,
  selectDefaultViewConfig,
  selectDefaultViewConfigsLoaded,
  selectViewByCode,
  selectViewsLoaded,
} from '../../../core/store/views/views.state';
import {DEFAULT_PERSPECTIVE_ID, Perspective} from '../perspective';
import {map, mergeMap, skipWhile, take, tap, withLatestFrom} from 'rxjs/operators';
import {parseSearchTabFromUrl} from '../../../core/store/navigation/search-tab';
import {DefaultViewConfig, View} from '../../../core/store/views/view';
import {ViewsAction} from '../../../core/store/views/views.action';
import {WorkspaceService} from '../../../workspace/workspace.service';
import {Organization} from '../../../core/store/organizations/organization';
import {Project} from '../../../core/store/projects/project';
import {DashboardTab} from '../../../core/model/dashboard-tab';
import {selectSearchConfig} from '../../../core/store/searches/searches.state';
import {createSearchPerspectiveTabs} from '../../../core/store/views/view.utils';

@Injectable()
export class SearchPerspectiveRedirectGuard implements CanActivate {
  public constructor(
    private router: Router,
    private store$: Store<AppState>,
    private workspaceService: WorkspaceService,
    private serializer: UrlSerializer
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
    return combineLatest([
      this.selectDefaultViewConfig$(organization, project),
      this.selectViewAndSearchTabs$(organization, project, viewCode),
    ]).pipe(
      take(1),
      map(([defaultConfig, {tabs, view}]) => {
        const viewPath: any[] = ['/w', organization.code, project.code, 'view'];
        if (viewCode) {
          viewPath.push({vc: viewCode});
        }
        viewPath.push(Perspective.Search);

        const desiredSearchTab = parseSearchTabFromUrl(currentUrl);
        let selectedTab = desiredSearchTab && tabs.find(tab => tab.id === desiredSearchTab);
        if (!selectedTab) {
          const configSearchTab = view?.config?.search?.searchTab || defaultConfig?.config?.search?.searchTab;
          selectedTab = (configSearchTab && tabs.find(tab => tab.id === configSearchTab)) || tabs[0];
        }

        if (selectedTab) {
          viewPath.push(selectedTab.id);
        }

        const currentUrlWithoutQuery = currentUrl.split('?')[0];
        const viewPathString = this.serializer.serialize(this.router.createUrlTree(viewPath));
        if (currentUrlWithoutQuery === viewPathString) {
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

  private selectViewsByCode$(organization: Organization, project: Project, code: string): Observable<View> {
    return this.store$.pipe(
      select(selectViewsLoaded),
      tap(loaded => {
        if (!loaded) {
          const workspace = {organizationId: organization.id, projectId: project.id};
          this.store$.dispatch(new ViewsAction.Get({workspace}));
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectViewByCode(code))))
    );
  }

  private selectViewAndSearchTabs$(
    organization: Organization,
    project: Project,
    viewCode: string
  ): Observable<{view: View; tabs: DashboardTab[]}> {
    return this.selectViewsByCode$(organization, project, viewCode).pipe(
      withLatestFrom(
        this.store$.pipe(select(selectDefaultSearchPerspectiveTabs)),
        this.store$.pipe(select(selectSearchConfig))
      ),
      map(([view, defaultTabs, searchConfig]) => ({
        view,
        tabs: createSearchPerspectiveTabs(searchConfig || view?.config?.search, defaultTabs).filter(tab => !tab.hidden),
      }))
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
