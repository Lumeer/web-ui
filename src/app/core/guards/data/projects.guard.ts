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

import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, Resolve, Router, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs';
import {first, map, mergeMap, skipWhile, tap} from 'rxjs/operators';
import {NotificationService} from '../../notifications/notification.service';
import {AppState} from '../../store/app.state';
import {selectOrganizationByCode} from '../../store/organizations/organizations.state';
import {ProjectModel} from '../../store/projects/project.model';
import {ProjectsAction} from '../../store/projects/projects.action';
import {selectProjectByOrganizationAndCode, selectProjectsByOrganizationId, selectProjectsLoadedForOrganization} from '../../store/projects/projects.state';

@Injectable()
export class ProjectsGuard implements Resolve<ProjectModel[]> {

  constructor(private i18n: I18n,
              private notificationService: NotificationService,
              private router: Router,
              private store$: Store<AppState>) {
  }

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<ProjectModel[]> {
    const organizationCode = route.paramMap.get('organizationCode');
    const projectCode = route.paramMap.get('projectCode');

    return this.store$.select(selectOrganizationByCode(organizationCode)).pipe(
      skipWhile(organization => !organization),
      first(),
      mergeMap(organization => this.store$.select(selectProjectsLoadedForOrganization(organization.id)).pipe(
        tap(loaded => {
          if (!loaded) {
            this.store$.dispatch(new ProjectsAction.Get({organizationId: organization.id}));
          }
        }),
        skipWhile(loaded => !loaded),
        first(),
        mergeMap(() => {
          if (!projectCode) {
            return this.store$.select(selectProjectsByOrganizationId(organization.id));
          }

          return this.store$.select(selectProjectByOrganizationAndCode(organization.id, projectCode)).pipe(
            map(project => {
              if (project) {
                return [project];
              }

              this.navigateToWorkspaceSelection();
              return [];
            })
          );
        }),
        first()
      ))
    );
  }

  private navigateToWorkspaceSelection() {
    this.router.navigate(['/', 'workspace']);

    const message = this.i18n({id: 'project.not.exist', value: 'Project does not exist'});
    this.notificationService.error(message);
  }

}
