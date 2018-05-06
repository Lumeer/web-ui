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
import {Observable} from 'rxjs/Observable';
import {mergeMap} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {AppState} from '../core/store/app.state';
import {NotificationsAction} from '../core/store/notifications/notifications.action';
import {RouterAction} from '../core/store/router/router.action';
import {WorkspaceService} from './workspace.service';

@Injectable()
export class WorkspaceGuard implements CanActivate {

  public constructor(private i18n: I18n,
                     private router: Router,
                     private workspaceService: WorkspaceService,
                     private store: Store<AppState>) {
  }

  public canActivate(next: ActivatedRouteSnapshot,
                     state: RouterStateSnapshot): Observable<boolean> {

    const organizationCode = next.paramMap.get('organizationCode');
    const projectCode = next.paramMap.get('projectCode');

    return this.workspaceService.getOrganizationFromStoreOrApi(organizationCode).pipe(
      mergeMap(organization => {
        if (isNullOrUndefined(organization)) {
          this.dispatchErrorActions();
          return Observable.of(false);
        }

        return this.checkProject(organizationCode, organization.id, projectCode);
      })
    );
  }

  private checkProject(orgCode: string, orgId: string, projCode: string): Observable<boolean> {
    return this.workspaceService.getProjectFromStoreOrApi(orgCode, orgId, projCode).pipe(
      mergeMap(project => {
          if (isNullOrUndefined(project)) {
            this.dispatchErrorActions();
            return Observable.of(false);
          }
          return Observable.of(true);
        }
      ));
  }

  private dispatchErrorActions() {
    this.store.dispatch(new RouterAction.Go({path: ['workspace']}));

    const message = this.i18n({id: 'workspace.not.exist', value: 'Organization or project does not exist'});
    this.store.dispatch(new NotificationsAction.Error({message}));
  }
}
