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

import {Location} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {Store} from '@ngrx/store';
import {BehaviorSubject, Observable, timer} from 'rxjs';
import {map, take, tap} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {ProjectsAction} from '../../core/store/projects/projects.action';
import {AuthService} from '../auth.service';
import {SessionService} from '../session.service';
import {ModalsAction} from '../../core/store/modals/modals.action';
import {ConfigurationService} from '../../configuration/configuration.service';

@Component({
  selector: 'session-expired',
  templateUrl: './session-expired.component.html',
  styleUrls: ['./session-expired.component.scss'],
})
export class SessionExpiredComponent implements OnInit {
  public readonly sessionTimeout;

  public redirecting$ = new BehaviorSubject(false);
  public isAuthenticated$: Observable<boolean>;

  private redirectUrl: string;

  public constructor(
    private location: Location,
    private route: ActivatedRoute,
    private store$: Store<AppState>,
    private sessionService: SessionService,
    private authService: AuthService,
    private router: Router,
    private configurationService: ConfigurationService
  ) {
    this.sessionTimeout = this.configurationService.getConfiguration().sessionTimeout;
  }

  public ngOnInit() {
    this.store$.dispatch(new ModalsAction.Hide());
    this.bindAuthenticated();
    this.disableBackButton();
    this.clearStore();
    this.bindRedirectUrl();
  }

  private bindAuthenticated() {
    this.isAuthenticated$ = timer(0, 3000).pipe(map(() => this.authService.isAuthenticated()));
  }

  private disableBackButton() {
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
      history.go(1);
    };
  }

  private clearStore() {
    this.store$.dispatch(new ProjectsAction.ClearWorkspaceData({}));
  }

  private bindRedirectUrl() {
    this.route.queryParamMap
      .pipe(
        map(params => params.get('redirectUrl') || ''),
        tap(redirectUrl => this.authService.saveLoginRedirectPath(redirectUrl)),
        take(1)
      )
      .subscribe(redirectUrl => (this.redirectUrl = redirectUrl));
  }

  public onContinue() {
    this.redirecting$.next(true);

    this.authService.checkToken().subscribe(valid => {
      if (valid) {
        this.sessionService.init();
        this.router.navigateByUrl(this.redirectUrl);
      } else {
        this.authService.login(this.redirectUrl);
      }
    });
  }
}
