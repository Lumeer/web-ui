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
import {ActivatedRouteSnapshot, CanActivate, CanActivateChild, RouterStateSnapshot} from '@angular/router';
import {AuthService} from './auth.service';
import {Angulartics2} from 'angulartics2';
import {Observable, of} from 'rxjs';
import {tap} from 'rxjs/operators';
import {ConfigurationService} from '../configuration/configuration.service';

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate, CanActivateChild {
  public constructor(
    private angulartics2: Angulartics2,
    private authService: AuthService,
    private configurationService: ConfigurationService
  ) {}

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.isAuthenticated(state);
  }

  public canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    return this.isAuthenticated(state);
  }

  private isAuthenticated(state: RouterStateSnapshot): Observable<boolean> {
    if (this.configurationService.getConfiguration().auth && !this.authService.isAuthenticated()) {
      return this.authService.checkToken().pipe(tap(valid => !valid && this.authService.login(state.url)));
    }
    return of(true);
  }
}
