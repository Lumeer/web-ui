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
import {Observable} from 'rxjs/Observable';
import {filter, map} from 'rxjs/operators';
import {selectCurrentUser} from '../store/users/users.state';
import {AppState} from '../store/app.state';
import {Store} from '@ngrx/store';
import {DefaultWorkspaceModel} from '../store/users/user.model';
import {isNullOrUndefined} from "util";

@Injectable()
export class PageNotFoundGuard implements CanActivate {

  constructor(private store: Store<AppState>,
              private i18n: I18n,
              private notificationService: NotificationService,
              private router: Router) {
  }

  public canActivate(next: ActivatedRouteSnapshot,
                     state: RouterStateSnapshot): Observable<boolean> {
    const [, w, organizationCode, projectCode] = state.url.split('/');

    return this.getDefaultWorkspace().pipe(
      map(workspace => {
        const hasWorkspace = workspace && workspace.organizationCode && workspace.projectCode;
        if (w === 'w' && organizationCode && projectCode) {
          this.router.navigate(['w', organizationCode, projectCode, 'view', 'search']);
        } else if(hasWorkspace) {
          this.router.navigate(['w', workspace.organizationCode, workspace.projectCode, 'view', 'search']);
        }else{
          this.router.navigate(['workspace']);
        }
        const message = this.i18n({id: 'page.not.found', value: 'Page not found'});
        this.notificationService.error(message);

        return false
      })
    );

  }

  private getDefaultWorkspace(): Observable<DefaultWorkspaceModel> {
    return this.store.select(selectCurrentUser).pipe(
      filter(user => !isNullOrUndefined(user)),
      map(user => user.defaultWorkspace)
    );
  }

}
