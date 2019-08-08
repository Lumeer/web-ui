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
import {TemplateType, templateTypesMap} from './model/template';

@Component({
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RedirectComponent implements OnInit {
  constructor(
    private workspaceSelectService: WorkspaceSelectService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private store$: Store<AppState>
  ) {}

  public ngOnInit() {
    this.activatedRoute.paramMap
      .pipe(
        map(params => params.get('templateId')),
        take(1)
      )
      .subscribe(templateId => this.redirectToTemplate(templateId));
  }

  public redirectToTemplate(templateId: string) {
    const template = templateTypesMap[templateId];
    if (!template) {
      return this.redirectToHome();
    }

    this.selectUser()
      .pipe(
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
                    return organizations[organizationIndex];
                  }
                  checkedIds.push(user.defaultWorkspace.organizationId);
                }

                for (const organization of organizations.filter(org => !checkedIds.includes(org.id))) {
                  const organizationIndex = organizations.findIndex(org => org.id === organization.id);
                  if (organizationIndex >= 0 && canCreateArray[organizationIndex]) {
                    return organizations[organizationIndex];
                  }
                }
                return null;
              })
            );
          } else {
            return of(null);
          }
        }),
        take(1)
      )
      .subscribe(organization => {
        if (organization) {
          this.createProject(organization, template);
        } else {
          this.redirectToHome();
        }
      });
  }

  private createProject(organization: Organization, template: TemplateType) {
    const modalRef = this.workspaceSelectService.createNewProject(organization, template);
    modalRef.content.onClose$.subscribe(() => this.redirectToHome());
  }

  private redirectToHome() {
    this.router.navigate(['/']);
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
