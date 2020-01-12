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
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree} from '@angular/router';
import {Observable, of} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../core/store/app.state';
import {selectDefaultViewConfig, selectDefaultViewConfigsLoaded} from '../../../core/store/views/views.state';
import {Perspective} from '../perspective';
import {DEFAULT_SEARCH_ID} from '../../../core/store/searches/search';
import {map, mergeMap, skipWhile, take, tap} from 'rxjs/operators';
import {parseSearchTabFromUrl, SearchTab} from '../../../core/store/navigation/search-tab';
import {DefaultViewConfig} from '../../../core/store/views/view';
import {ViewsAction} from '../../../core/store/views/views.action';
import {WorkspaceService} from '../../../workspace/workspace.service';
import {Organization} from '../../../core/store/organizations/organization';
import {Project} from '../../../core/store/projects/project';

@Injectable()
export class SearchPerspectiveRedirectGuard implements CanActivate {
  public constructor(
    private router: Router,
    private store$: Store<AppState>,
    private workspaceService: WorkspaceService
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> {
    const {organizationCode, projectCode, viewCode} = this.getParams(next);
    const searchTab = parseSearchTabFromUrl(state.url);
    if (searchTab) {
      return of(true);
    }

    return this.workspaceService
      .selectOrGetWorkspace(organizationCode, projectCode)
      .pipe(mergeMap(({organization, project}) => this.resolveSearchTab(organization, project, viewCode)));
  }

  private resolveSearchTab(organization: Organization, project: Project, viewCode: string): Observable<UrlTree> {
    return this.selectDefaultViewConfig$(organization, project).pipe(
      take(1),
      map(defaultConfig => {
        const viewPath: any[] = ['w', organization.code, project.code, 'view'];
        if (viewCode) {
          viewPath.push({vc: viewCode});
        }
        viewPath.push(Perspective.Search);

        const searchConfig = defaultConfig && defaultConfig.config && defaultConfig.config.search;
        viewPath.push((searchConfig && searchConfig.searchTab) || SearchTab.All);

        return this.router.createUrlTree(viewPath, {queryParamsHandling: 'preserve'});
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
      mergeMap(() => this.store$.pipe(select(selectDefaultViewConfig(Perspective.Search, DEFAULT_SEARCH_ID))))
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
