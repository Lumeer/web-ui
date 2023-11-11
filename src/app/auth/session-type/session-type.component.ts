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

import {Component} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {AuthService} from '../auth.service';
import {SessionType} from '../common/session-type';
import {map, take} from 'rxjs/operators';
import {BehaviorSubject} from 'rxjs';

@Component({
  templateUrl: './session-type.component.html',
  styleUrls: ['../common/auth-styles.scss', './session-type.component.scss'],
})
export class SessionTypeComponent {
  public performingRequest$ = new BehaviorSubject(false);

  public constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  public onYesClick() {
    this.setSessionType(SessionType.StayLoggedIn);
  }

  public onNeverClick() {
    this.setSessionType(SessionType.NeverAsk);
  }

  public onAskLaterClick() {
    this.setSessionType(SessionType.AskAgain);
  }

  private setSessionType(type: SessionType) {
    this.performingRequest$.next(true);

    this.route.queryParamMap
      .pipe(
        take(1),
        map(params => params.get('code'))
      )
      .subscribe(code => this.authService.setSessionType(type, code));
  }
}
