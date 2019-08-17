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
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map, skipWhile, switchMap, take, tap, mergeMap} from 'rxjs/operators';
import {AppState} from '../store/app.state';
import {convertQueryModelToString} from '../store/navigation/query/query.converter';
import {ViewsAction} from '../store/views/views.action';
import {selectViewByCode, selectViewsLoaded} from '../store/views/views.state';
import {Perspective} from '../../view/perspectives/perspective';
import {WorkspaceService} from '../../workspace/workspace.service';
import {Organization} from '../store/organizations/organization';
import {Project} from '../store/projects/project';

@Injectable()
export class ViewRedirectGuard implements CanActivate {
  public constructor(
    private router: Router,
    private store$: Store<AppState>,
    private workspaceService: WorkspaceService
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const organizationCode = next.paramMap.get('organizationCode');
    const projectCode = next.paramMap.get('projectCode');
    const viewCode = next.paramMap.get('vc');

    return this.workspaceService
      .selectOrGetWorkspace(organizationCode, projectCode)
      .pipe(mergeMap(({organization, project}) => this.canActivateView(organization, project, viewCode)));
  }

  private canActivateView(organization: Organization, project: Project, viewCode: string): Observable<boolean> {
    return this.store$.pipe(
      select(selectViewsLoaded),
      tap(loaded => {
        if (!loaded) {
          const workspace = {organizationId: organization.id, projectId: project.id};
          this.store$.dispatch(new ViewsAction.Get({workspace}));
        }
      }),
      skipWhile(loaded => !loaded),
      switchMap(() => this.store$.pipe(select(selectViewByCode(viewCode)))),
      take(1),
      map(view => {
        const perspective = view && view.perspective ? view.perspective : Perspective.Search;
        const query = view ? convertQueryModelToString(view.query) : null;

        const viewPath: any[] = ['w', organization.code, project.code, 'view'];
        if (viewCode) {
          viewPath.push({vc: viewCode});
        }
        viewPath.push(perspective);

        this.router.navigate(viewPath, {queryParams: {q: query}});

        return false;
      })
    );
  }
}
