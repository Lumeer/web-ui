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

import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {filter, take} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {selectCurrentUser} from '../../core/store/users/users.state';
import {AuthService} from '../auth.service';

@Component({
  selector: 'auth-callback',
  template: ''
})
export class AuthCallbackComponent implements OnInit {

  public constructor(private authService: AuthService,
                     private router: Router,
                     private store: Store<AppState>) {
  }

  public ngOnInit() {
    const path = this.authService.getLoginRedirectPath();

    const urls = path.split('?', 2);
    const params = this.router.parseUrl(path).queryParams;
    const queryParams = urls.length > 1 ? {queryParams: params} : undefined;

    this.store.select(selectCurrentUser).pipe(
      filter(user => !!user),
      take(1)
    ).subscribe(user => this.router.navigate([urls[0]], queryParams));
  }

}
