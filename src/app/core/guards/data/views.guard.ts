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
import {ActivatedRouteSnapshot, Router, RouterStateSnapshot} from '@angular/router';

import {Store, select} from '@ngrx/store';

import {Observable, of} from 'rxjs';
import {first, mergeMap, switchMap} from 'rxjs/operators';

import {Perspective} from '../../../view/perspectives/perspective';
import {ResourcesGuardService} from '../../../workspace/resources-guard.service';
import {WorkspaceService} from '../../../workspace/workspace.service';
import {NotificationService} from '../../notifications/notification.service';
import {AppState} from '../../store/app.state';
import {selectViewsByRead} from '../../store/common/permissions.selectors';
import {Organization} from '../../store/organizations/organization';
import {Project} from '../../store/projects/project';
import {View} from '../../store/views/view';

@Injectable()
export class ViewsGuard {
  constructor(
    private notificationService: NotificationService,
    private workspaceService: WorkspaceService,
    private resourcesGuardService: ResourcesGuardService,
    private router: Router,
    private store$: Store<AppState>
  ) {}

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<View[]> {
    const viewCode = route.paramMap.get('vc');
    const organizationCode = route.paramMap.get('organizationCode');
    const projectCode = route.paramMap.get('projectCode');

    return this.workspaceService
      .selectOrGetWorkspace(organizationCode, projectCode)
      .pipe(mergeMap(({organization, project}) => this.resolveView(organization, project, viewCode)));
  }

  private resolveView(organization: Organization, project: Project, viewCode: string): Observable<View[]> {
    return this.resourcesGuardService.selectViewByCode$(organization, project, viewCode).pipe(
      switchMap(view => {
        if (!viewCode) {
          return this.store$.pipe(select(selectViewsByRead));
        }

        if (view) {
          return of([view]);
        }

        this.onViewNotFound(organization.code, project.code);
        return of([]);
      }),
      first()
    );
  }

  private onViewNotFound(organizationCode: string, projectCode: string) {
    this.router.navigate(['w', organizationCode, projectCode, 'view', Perspective.Search]);
    const message = $localize`:@@view.not.found:View not found`;
    this.notificationService.error(message);
  }
}
