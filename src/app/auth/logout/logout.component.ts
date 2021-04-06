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

import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {AuthService} from '../auth.service';
import {ModalsAction} from '../../core/store/modals/modals.action';
import {AppState} from '../../core/store/app.state';
import {Store} from '@ngrx/store';

@Component({
  selector: 'logout',
  template: '',
})
export class LogoutComponent implements OnInit {
  public constructor(private authService: AuthService, private router: Router, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.store$.dispatch(new ModalsAction.Hide());
    this.navigateToApplication();
  }

  private navigateToApplication() {
    const path = this.authService.getAndClearLoginRedirectPath();
    if (path) {
      this.router.navigateByUrl(path);
    } else {
      this.router.navigate(['/']);
    }
  }
}
