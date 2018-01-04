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
import {Observable} from 'rxjs/Observable';
import {catchError, tap, map, take, switchMap} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {OrganizationService, ProjectService} from '../core/rest';
import {AppState} from '../core/store/app.state';
import {OrganizationsAction} from '../core/store/organizations/organizations.action';
import {selectAllOrganizations} from '../core/store/organizations/organizations.state';
import {ProjectsAction} from '../core/store/projects/projects.action';
import {selectAllProjects} from '../core/store/projects/projects.state';
import {RouterAction} from '../core/store/router/router.action';

@Injectable()
export class WorkspaceGuard implements CanActivate {

  public constructor(private router: Router,
                     private organizationService: OrganizationService,
                     private projectService: ProjectService,
                     private store: Store<AppState>) {
  }

  public canActivate(next: ActivatedRouteSnapshot,
                     state: RouterStateSnapshot): Observable<boolean> {

    const organizationCode = next.paramMap.get('organizationCode');
    const projectCode = next.paramMap.get('projectCode');

    return Observable.combineLatest(
      this.hasOrganization(organizationCode),
      this.hasProject(organizationCode, projectCode)
    ).pipe(
      switchMap(([hasOrganization, hasProject]) => Observable.of(hasOrganization && hasProject))
    );
  }

  private hasOrganization(code: string): Observable<boolean> {
    return this.hasOrganizationInStore(code).pipe(
      switchMap(inStore => {
        if (inStore) {
          return Observable.of(inStore);
        }
        return this.hasOrganizationInApi(code);
      })
    );
  }

  private hasOrganizationInStore(code: string): Observable<boolean> {
    return this.store.select(selectAllOrganizations).pipe(
      map(organizations => !isNullOrUndefined(organizations.find(org => org.code === code))),
      take(1)
    );
  }

  private hasOrganizationInApi(code: string): Observable<boolean> {
    return this.organizationService.getOrganization(code).pipe(
      tap(organization => this.store.dispatch(new OrganizationsAction.GetSuccess({organizations: [organization]}))),
      map(organization => !isNullOrUndefined(organization)),
      catchError(() => {
        this.store.dispatch(new RouterAction.Go({path: ['404']}));
        return Observable.of(false);
      })
    );
  }

  private hasProject(orgCode: string, projCode: string): Observable<boolean> {
    return this.hasProjectInStore(projCode).pipe(
      switchMap(inStore => {
        if (inStore) {
          return Observable.of(inStore);
        }
        return this.hasProjectInApi(orgCode, projCode);
      })
    );
  }

  private hasProjectInStore(code: string): Observable<boolean> {
    return this.store.select(selectAllProjects).pipe(
      map(projects => !!projects.find(proj => proj.code === code)),
      take(1)
    );
  }

  private hasProjectInApi(orgCode: string, projCode: string): Observable<boolean> {
    return this.projectService.getProject(orgCode, projCode).pipe(
      tap(project => this.store.dispatch(new ProjectsAction.GetSuccess({projects: [project]}))),
      map(project => !isNullOrUndefined(project)),
      catchError(() => {
        this.store.dispatch(new RouterAction.Go({path: ['404']}));
        return Observable.of(false);
      })
    );
  }

}
