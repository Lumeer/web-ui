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

import {of, Observable, combineLatest} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {catchError, filter, first, map, mergeMap, skipWhile, switchMap, take, tap} from 'rxjs/operators';
import {AppState} from '../core/store/app.state';
import {OrganizationConverter} from '../core/store/organizations/organization.converter';
import {Organization} from '../core/store/organizations/organization';
import {OrganizationsAction} from '../core/store/organizations/organizations.action';
import {selectAllOrganizations} from '../core/store/organizations/organizations.state';
import {ProjectConverter} from '../core/store/projects/project.converter';
import {Project} from '../core/store/projects/project';
import {ProjectsAction} from '../core/store/projects/projects.action';
import {
  selectProjectsByOrganizationId,
  selectProjectsLoadedForOrganization,
  selectReadableProjectsForOrganization,
} from '../core/store/projects/projects.state';
import {User} from '../core/store/users/user';
import {CommonAction} from '../core/store/common/common.action';
import {OrganizationService, ProjectService} from '../core/data-service';
import {selectCurrentUserForOrganization} from '../core/store/users/users.state';
import {selectTeamsByOrganization, selectTeamsLoadedForOrganization} from '../core/store/teams/teams.state';
import {TeamsAction} from '../core/store/teams/teams.action';
import {Team} from '../core/store/teams/team';
import {userHasRoleInProject} from '../shared/utils/permission.utils';
import {RoleType} from '../core/model/role-type';
import {AuthService} from '../auth/auth.service';
import {isNotNullOrUndefined, isNullOrUndefined} from '@lumeer/utils';

@Injectable()
export class WorkspaceService {
  constructor(
    private organizationService: OrganizationService,
    private projectService: ProjectService,
    private store$: Store<AppState>,
    private authService: AuthService
  ) {}

  public selectOrGetUserAndOrganization(
    organizationCode: string
  ): Observable<{user?: User; organization?: Organization}> {
    return this.getOrganizationFromStoreOrApi(organizationCode).pipe(
      mergeMap(organization => {
        if (organization) {
          return this.selectUser(organization).pipe(map(user => ({organization, user})));
        }
        return of({});
      })
    );
  }

  public selectOrGetUserAndWorkspace(
    organizationCode: string,
    projectCode: string
  ): Observable<{user?: User; organization?: Organization; project?: Project}> {
    return this.getOrganizationFromStoreOrApi(organizationCode).pipe(
      mergeMap(organization =>
        this.selectUserTeamsAndProject(organization, projectCode).pipe(
          map(({user, project}) => ({user, organization, project}))
        )
      )
    );
  }

  public selectOrGetUserAndOrganizationAndProjects(
    organizationCode: string
  ): Observable<{user?: User; organization?: Organization; projects?: Project[]}> {
    return this.getOrganizationFromStoreOrApi(organizationCode).pipe(
      mergeMap(organization =>
        this.selectUserTeamsAndProjects(organization).pipe(map(({user, projects}) => ({user, organization, projects})))
      )
    );
  }

  public selectOrGetWorkspace(
    organizationCode: string,
    projectCode: string
  ): Observable<{organization?: Organization; project?: Project}> {
    return this.getOrganizationFromStoreOrApi(organizationCode).pipe(
      mergeMap(organization => {
        if (organization) {
          return this.getProjectFromStoreOrApi(organization.id, projectCode).pipe(
            map(project => ({organization, project}))
          );
        }
        return of({});
      })
    );
  }

  public switchWorkspace(organization: Organization, project: Project): Observable<boolean> {
    return new Observable(observer => {
      const callback = () => {
        observer.next(true);
        observer.complete();
      };

      const callbackAction = new CommonAction.ExecuteCallback({callback});
      this.store$.dispatch(
        new ProjectsAction.SwitchWorkspace({
          organizationId: organization.id,
          projectId: project.id,
          nextAction: callbackAction,
        })
      );
    });
  }

  private selectUserTeamsAndProject(
    organization: Organization,
    projectCode: string
  ): Observable<{user?: User; project?: Project}> {
    if (organization) {
      return combineLatest([
        this.selectUser(organization),
        this.getProjectFromStoreOrApi(organization.id, projectCode),
      ]).pipe(map(([user, project]) => ({user, project})));
    }
    return of({});
  }

  private selectUserTeamsAndProjects(organization: Organization): Observable<{user?: User; projects?: Project[]}> {
    if (organization) {
      return this.selectUser(organization).pipe(
        switchMap(user => this.getProjects(organization, user).pipe(map(projects => ({user, projects}))))
      );
    }
    return of({});
  }

  private selectUser(organization: Organization): Observable<User> {
    return this.selectTeams(organization).pipe(
      switchMap(() =>
        this.store$.pipe(
          select(selectCurrentUserForOrganization(organization)),
          filter(user => isNotNullOrUndefined(user))
        )
      )
    );
  }

  private selectTeams(organization: Organization): Observable<Team[]> {
    return this.store$.select(selectTeamsLoadedForOrganization(organization.id)).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new TeamsAction.Get({organizationId: organization.id}));
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() => this.store$.pipe(select(selectTeamsByOrganization(organization.id)))),
      first()
    );
  }

  private getOrganizationFromStoreOrApi(code: string): Observable<Organization> {
    return this.getOrganizationFromStore(code).pipe(
      mergeMap(organization => {
        if (isNotNullOrUndefined(organization)) {
          return of(organization);
        }
        return this.getOrganizationFromApi(code);
      })
    );
  }

  private getOrganizationFromStore(code: string): Observable<Organization> {
    return this.store$.pipe(
      select(selectAllOrganizations),
      map(organizations => organizations.find(org => org.code === code)),
      take(1)
    );
  }

  private getOrganizationFromApi(code: string): Observable<Organization> {
    return this.authService.isAuthenticated$().pipe(
      filter(authenticated => authenticated),
      take(1),
      mergeMap(() => this.organizationService.getOrganizationByCode(code)),
      map(organization => OrganizationConverter.fromDto(organization)),
      tap(organization => this.store$.dispatch(new OrganizationsAction.GetOneSuccess({organization}))),
      catchError(() => of(undefined))
    );
  }

  private getProjectFromStoreOrApi(orgId: string, projCode: string): Observable<Project> {
    return this.getProjectFromStore(orgId, projCode).pipe(
      mergeMap(project => {
        if (!isNullOrUndefined(project)) {
          return of(project);
        }
        return this.getProjectFromApi(orgId, projCode);
      })
    );
  }

  private getProjectFromStore(organizationId: string, code: string): Observable<Project> {
    return this.store$.pipe(
      select(selectReadableProjectsForOrganization(organizationId)),
      map(projects => projects.find(proj => proj.code === code)),
      take(1)
    );
  }

  private getProjectFromApi(orgId: string, projCode: string): Observable<Project> {
    return this.authService.isAuthenticated$().pipe(
      filter(authenticated => authenticated),
      take(1),
      mergeMap(() => this.projectService.getProjectByCode(orgId, projCode)),
      map(project => ProjectConverter.fromDto(project, orgId)),
      tap(project => this.store$.dispatch(new ProjectsAction.GetOneSuccess({project}))),
      catchError(() => of(undefined))
    );
  }

  private getProjects(organization: Organization, user: User): Observable<Project[]> {
    return this.store$.select(selectProjectsLoadedForOrganization(organization.id)).pipe(
      tap(loaded => {
        if (!loaded) {
          this.store$.dispatch(new ProjectsAction.Get({organizationId: organization.id}));
        }
      }),
      skipWhile(loaded => !loaded),
      mergeMap(() =>
        this.store$.pipe(
          select(selectProjectsByOrganizationId(organization.id)),
          map(projects =>
            projects.filter(
              project =>
                project.organizationId === organization.id &&
                userHasRoleInProject(organization, project, user, RoleType.Read)
            )
          )
        )
      ),
      first()
    );
  }
}
