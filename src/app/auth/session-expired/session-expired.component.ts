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

import {Location} from '@angular/common';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {environment} from '../../../environments/environment';

@Component({
  selector: 'session-expired',
  templateUrl: './session-expired.component.html',
  styleUrls: ['./session-expired.component.scss']
})
export class SessionExpiredComponent implements OnInit {

  public readonly sessionTimeout = environment.sessionTimeout;

  public redirectUrl$: Observable<string>;

  public constructor(private location: Location,
                     private route: ActivatedRoute) {
  }

  public ngOnInit() {
    this.disableBackButton();
    this.clearStore();
    this.bindRedirectUrl();

  }

  private disableBackButton() {
    history.pushState(null, null, location.href);
    window.onpopstate = function () {
      history.go(1);
    };
  }

  private clearStore() {
    // TODO implement just in case of back button disabling not working in all browsers
  }

  private bindRedirectUrl() {
    this.redirectUrl$ = this.route.queryParamMap.pipe(
      map(params => {
        const redirectUrl = params.get('redirectUrl') || '';
        return window.location.origin + this.location.prepareExternalUrl(redirectUrl);
      })
    );
  }

}
