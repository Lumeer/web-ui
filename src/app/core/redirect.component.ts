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

import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {combineLatest, forkJoin, Observable, of} from 'rxjs';
import {filter, first, map, mergeMap, skipWhile, take, tap} from 'rxjs/operators';
import {Organization} from './store/organizations/organization';
import {Project} from './store/projects/project';
import {User} from './store/users/user';
import {ServiceLimits} from './store/organizations/service-limits/service.limits';
import {userHasRoleInResource} from '../shared/utils/resource.utils';
import {Role} from './model/role';
import {
  selectAllServiceLimits,
  selectServiceLimitsLoaded,
} from './store/organizations/service-limits/service-limits.state';
import {ServiceLimitsAction} from './store/organizations/service-limits/service-limits.action';
import {select, Store} from '@ngrx/store';
import {selectAllOrganizations, selectOrganizationsLoaded} from './store/organizations/organizations.state';
import {OrganizationsAction} from './store/organizations/organizations.action';
import {selectProjectsByOrganizationId, selectProjectsLoadedForOrganization} from './store/projects/projects.state';
import {ProjectsAction} from './store/projects/projects.action';
import {selectCurrentUser} from './store/users/users.state';
import {isNotNullOrUndefined} from '../shared/utils/common.utils';
import {WorkspaceSelectService} from './service/workspace-select.service';
import {AppState} from './store/app.state';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {NotificationsAction} from './store/notifications/notifications.action';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedirectComponent implements OnInit {
  constructor(
    private workspaceSelectService: WorkspaceSelectService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private store$: Store<AppState>,
    private i18n: I18n
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap.pipe(take(1)).subscribe(params => {
      const templateCode = params.get('templateCode');
      const organizationId = params.get('organizationId');
      const projectId = params.get('projectId');
      if (templateCode) {
        this.redirectToTemplate(templateCode);
      } else if (organizationId && projectId) {
        this.redirectToCopyProject(organizationId, projectId);
      } else {
        return this.redirectToHome();
      }
    });
  }

  public redirectToTemplate(templateCode: string) {
    this.selectWritableOrganization(organization => this.createProjectByTemplate(organization, templateCode));
  }

  public redirectToCopyProject(organizationId: string, projectId: string) {
    this.selectWritableOrganization(organization => this.createProjectByCopy(organization, organizationId, projectId));
  }

  public selectWritableOrganization(callback: (Organization) => void) {
    this.selectUser()
      .pipe(
        mergeMap(user =>
          combineLatest([this.selectOrganizations(), this.selectServiceLimits()]).pipe(
            map(([organizations, limits]) => ({user, organizations, limits}))
          )
        ),
        mergeMap(({user, organizations, limits}) => {
          if (organizations && organizations.length) {
            const observables: Observable<boolean>[] = (organizations || []).map(organization =>
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
                    return {organization: organizations[organizationIndex]};
                  }
                  checkedIds.push(user.defaultWorkspace.organizationId);
                }

                for (const organization of organizations.filter(org => !checkedIds.includes(org.id))) {
                  const organizationIndex = organizations.findIndex(org => org.id === organization.id);
                  if (organizationIndex >= 0 && canCreateArray[organizationIndex]) {
                    return {organization: organizations[organizationIndex]};
                  }
                }
                return {organization: null, hasOrganization: true};
              })
            );
          } else {
            return of({organization: null, hasOrganization: false});
          }
        }),
        take(1)
      )
      .subscribe(({organization, hasOrganization}) => {
        if (organization) {
          callback(organization);
        } else {
          this.redirectToHome(() => this.showError(hasOrganization));
        }
      });
  }

  private createProjectByCopy(organization: Organization, organizationId: string, projectId: string) {
    const modalRef = this.workspaceSelectService.copyProject(organization, organizationId, projectId, {
      replaceUrl: true,
    });
    modalRef.content.onClose$.subscribe(() => this.redirectToHome());
  }

  private createProjectByTemplate(organization: Organization, templateCode: string) {
    const modalRef = this.workspaceSelectService.createNewProject(organization, templateCode, {replaceUrl: true});
    modalRef.content.onClose$.subscribe(() => this.redirectToHome());
  }

  private showError(hasOrganization: boolean) {
    let message: string;
    if (hasOrganization) {
      message = this.i18n({
        id: 'template.create.limitExceeded',
        value: 'I am sorry, you can not create any more projects in a free account.',
      });
    } else {
      message = this.i18n({
        id: 'template.create.empty',
        value: 'I am sorry, you do not have any organization to create project in.',
      });
    }
    setTimeout(() => this.store$.dispatch(new NotificationsAction.Error({message})), 1000);
  }

  private redirectToHome(then?: () => void) {
    this.router.navigate(['/'], {replaceUrl: true}).then(() => then?.());
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
