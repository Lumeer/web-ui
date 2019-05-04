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
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NotificationService} from '../notifications/notification.service';
import {combineLatest, forkJoin, Observable, of} from 'rxjs';
import {User} from '../store/users/user';
import {select, Store} from '@ngrx/store';
import {selectCurrentUser} from '../store/users/users.state';
import {filter, first, map, mergeMap, skipWhile, tap} from 'rxjs/operators';
import {isNotNullOrUndefined} from '../../shared/utils/common.utils';
import {AppState} from '../store/app.state';
import {Organization} from '../store/organizations/organization';
import {selectAllOrganizations, selectOrganizationsLoaded} from '../store/organizations/organizations.state';
import {OrganizationsAction} from '../store/organizations/organizations.action';
import {
  selectAllServiceLimits,
  selectServiceLimitsLoaded,
} from '../store/organizations/service-limits/service-limits.state';
import {ServiceLimitsAction} from '../store/organizations/service-limits/service-limits.action';
import {ServiceLimits} from '../store/organizations/service-limits/service.limits';
import {Project} from '../store/projects/project';
import {selectProjectsByOrganizationId, selectProjectsLoadedForOrganization} from '../store/projects/projects.state';
import {ProjectsAction} from '../store/projects/projects.action';
import {userHasRoleInResource} from '../../shared/utils/resource.utils';
import {Role} from '../model/role';
import {DialogService} from '../../dialog/dialog.service';
import {Perspective} from '../../view/perspectives/perspective';

@Injectable()
export class TemplateRedirectGuard implements CanActivate {
  constructor(
    private i18n: I18n,
    private notificationService: NotificationService,
    private router: Router,
    private dialogService: DialogService,
    private store$: Store<AppState>
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const templateId = next.paramMap.get('templateId');

    return this.selectUser().pipe(
      mergeMap(user =>
        combineLatest(this.selectOrganizations(), this.selectServiceLimits()).pipe(
          map(([organizations, limits]) => ({user, organizations, limits}))
        )
      ),
      mergeMap(({user, organizations, limits}) => {
        if (organizations && organizations.length) {
          const observables = (organizations || []).map(organization =>
            this.canCreateProjectsInOrganization(organization, user, limits)
          );
          return forkJoin(observables).pipe(
            map(canCreateArray => {
              const checkedIds = [];
              if (user.defaultWorkspace) {
                const organizationIndex = organizations.findIndex(
                  org => org.id === user.defaultWorkspace.organizationId
                );
                if (organizationIndex >= 0 && canCreateArray[organizationIndex]) {
                  return this.redirectToCreateProject(organizations[organizationIndex], templateId);
                }
                checkedIds.push(user.defaultWorkspace.organizationId);
              }

              for (const organization of organizations.filter(org => !checkedIds.includes(org.id))) {
                const organizationIndex = organizations.findIndex(org => org.id === organization.id);
                if (organizationIndex >= 0 && canCreateArray[organizationIndex]) {
                  return this.redirectToCreateProject(organizations[organizationIndex], templateId);
                }
              }
              return this.redirectToHome();
            })
          );
        } else {
          return of(this.redirectToHome());
        }
      })
    );
  }

  private redirectToCreateProject(organization: Organization, templateId: string): boolean {
    this.dialogService.openCreateProjectDialog(organization.id, templateId, project =>
      this.redirectToWorkspace(organization, project)
    );
    return false;
  }

  private redirectToWorkspace(organization: Organization, project: Project) {
    const path = ['w', organization.code, project.code, 'view', Perspective.Search, 'all'];
    this.router.navigateByUrl(path.join('/'));
  }

  private redirectToHome(): boolean {
    this.router.navigate(['/']);
    return false;
  }

  private canCreateProjectsInOrganization(
    organization: Organization,
    user: User,
    limits: ServiceLimits[]
  ): Observable<boolean> {
    const organizationLimits = (limits || []).find(limit => limit.organizationId === organization.id);
    if (!organizationLimits || !userHasRoleInResource(user, organization, Role.Write)) {
      return of(false);
    }

    return this.selectProjects(organization).pipe(
      map(projects => (projects || []).length < organizationLimits.projects)
    );
  }

  private selectServiceLimits(): Observable<ServiceLimits[]> {
    return this.store$.select(selectServiceLimitsLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new ServiceLimitsAction.GetAll());
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectAllServiceLimits))),
      first()
    );
  }

  private selectOrganizations(): Observable<Organization[]> {
    return this.store$.select(selectOrganizationsLoaded).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new OrganizationsAction.Get());
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectAllOrganizations))),
      first()
    );
  }

  private selectProjects(organization: Organization): Observable<Project[]> {
    return this.store$.select(selectProjectsLoadedForOrganization(organization.id)).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new ProjectsAction.Get({organizationId: organization.id}));
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectProjectsByOrganizationId(organization.id)))),
      first()
    );
  }

  private selectUser(): Observable<User> {
    return this.store$.pipe(
      select(selectCurrentUser),
      filter(user => isNotNullOrUndefined(user)),
      first()
    );
  }
}
