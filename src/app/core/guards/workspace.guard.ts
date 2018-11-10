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
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable, of} from 'rxjs';
import {filter, map, mergeMap, tap} from 'rxjs/operators';
import {NotificationService} from '../notifications/notification.service';
import {AppState} from '../store/app.state';
import {OrganizationModel} from '../store/organizations/organization.model';
import {OrganizationsAction} from '../store/organizations/organizations.action';
import {selectOrganizationByCode, selectOrganizationsLoaded} from '../store/organizations/organizations.state';
import {ProjectModel} from '../store/projects/project.model';
import {ProjectsAction} from '../store/projects/projects.action';
import {
  selectProjectByOrganizationAndCode,
  selectProjectsLoadedForOrganization,
} from '../store/projects/projects.state';
import {selectCurrentUser} from '../store/users/users.state';

@Injectable({
  providedIn: 'root',
})
export class WorkspaceGuard implements CanActivate {
  public constructor(
    private i18n: I18n,
    private notificationService: NotificationService,
    private router: Router,
    private store$: Store<AppState>
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const organizationCode = next.paramMap.get('organizationCode');
    const projectCode = next.paramMap.get('projectCode');

    if (!organizationCode || !projectCode) {
      this.navigateToHome();
      return of(false);
    }

    return this.store$.select(selectCurrentUser).pipe(
      filter(user => !!user),
      mergeMap(() =>
        this.getOrganization(organizationCode).pipe(
          mergeMap(organization => this.getProject(organization, projectCode)),
          map(project => !!project)
        )
      )
    );
  }

  private getOrganization(organizationCode: string): Observable<OrganizationModel> {
    return this.store$.select(selectOrganizationsLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new OrganizationsAction.Get());
        }
      }),
      filter(loaded => loaded),
      mergeMap(() =>
        this.store$.select(selectOrganizationByCode(organizationCode)).pipe(
          tap(organization => {
            if (!organization) {
              const message = this.i18n({id: 'organization.not.exist', value: 'Organization does not exist'});
              this.notificationService.error(message);

              this.navigateToHome();
            }
          })
        )
      )
    );
  }

  private getProject(organization: OrganizationModel, projectCode: string): Observable<ProjectModel> {
    if (!organization) {
      return of(null);
    }

    return this.store$.select(selectProjectsLoadedForOrganization(organization.id)).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new ProjectsAction.Get({organizationId: organization.id}));
        }
      }),
      filter(loaded => loaded),
      mergeMap(() =>
        this.store$.select(selectProjectByOrganizationAndCode(organization.id, projectCode)).pipe(
          tap(project => {
            if (project) {
              this.switchWorkspace(organization, project);
            } else {
              const message = this.i18n({id: 'project.not.exist', value: 'Project does not exist'});
              this.notificationService.error(message);

              this.navigateToHome();
            }
          })
        )
      )
    );
  }

  private switchWorkspace(organization: OrganizationModel, project: ProjectModel) {
    this.store$.dispatch(
      new ProjectsAction.SwitchWorkspace({
        organizationId: organization.id,
        projectId: project.id,
      })
    );
  }

  private navigateToHome() {
    this.router.navigate(['/']);
  }
}
