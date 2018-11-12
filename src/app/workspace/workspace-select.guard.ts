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
import {ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot} from '@angular/router';

import {Store} from '@ngrx/store';
import {Observable, combineLatest, of} from 'rxjs';
import {filter, first, map, mergeMap, switchMap} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {WorkspaceService} from './workspace.service';
import {AppState} from '../core/store/app.state';
import {OrganizationsAction} from '../core/store/organizations/organizations.action';
import {selectSelectedOrganization} from '../core/store/organizations/organizations.state';
import {ProjectsAction} from '../core/store/projects/projects.action';
import {selectSelectedProject} from '../core/store/projects/projects.state';
import {DefaultWorkspaceModel} from '../core/store/users/user.model';
import {selectCurrentUser} from '../core/store/users/users.state';

@Injectable()
export class WorkspaceSelectGuard implements CanActivate {
  public constructor(private workspaceService: WorkspaceService, private store: Store<AppState>) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.isSomethingSelected().pipe(switchMap(selected => this.checkOrFetch(selected)));
  }

  private checkOrFetch(selected: boolean): Observable<boolean> {
    if (selected) {
      return of(true);
    } else {
      return this.fetchDefault();
    }
  }

  private isSomethingSelected(): Observable<boolean> {
    return combineLatest(this.store.select(selectSelectedOrganization), this.store.select(selectSelectedProject)).pipe(
      first(),
      map(
        ([selectedOrganization, selectedProject]) =>
          !isNullOrUndefined(selectedOrganization) || !isNullOrUndefined(selectedProject)
      )
    );
  }

  private fetchDefault(): Observable<boolean> {
    return this.getDefaultWorkspace().pipe(
      mergeMap(workspace => {
        if (workspace && workspace.organizationCode && workspace.projectCode) {
          return this.workspaceService.getOrganizationFromStoreOrApi(workspace.organizationCode).pipe(
            switchMap(organization => {
              if (isNullOrUndefined(organization)) {
                return of(true);
              }
              return this.checkProject(workspace.organizationCode, organization.id, workspace.projectCode);
            })
          );
        } else {
          return of(true);
        }
      })
    );
  }

  private getDefaultWorkspace(): Observable<DefaultWorkspaceModel> {
    return this.store.select(selectCurrentUser).pipe(
      filter(user => !isNullOrUndefined(user)),
      map(user => user.defaultWorkspace)
    );
  }

  private checkProject(orgCode: string, orgId: string, projCode: string): Observable<boolean> {
    return this.workspaceService.getProjectFromStoreOrApi(orgCode, orgId, projCode).pipe(
      switchMap(project => {
        if (!isNullOrUndefined(project)) {
          this.store.dispatch(new OrganizationsAction.Select({organizationId: orgId}));
          this.store.dispatch(new ProjectsAction.Select({projectId: project.id}));
        }
        return of(true);
      })
    );
  }
}
