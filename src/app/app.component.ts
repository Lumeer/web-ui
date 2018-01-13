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

import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {Angulartics2GoogleAnalytics} from 'angulartics2/ga';
import * as jsSHA from 'jssha';

import {SnotifyService} from 'ng-snotify';
import {KeycloakService} from './core/keycloak/keycloak.service';

@Component({
  selector: 'lmr-app',
  templateUrl: './app.component.html',
  styleUrls: [
    './shared/common.scss',
    './app.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {

  constructor(private angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics,
              private notificationService: SnotifyService) {
    this.getUserProfileFromKeycloak().then(profile => {
      if (profile) {
        const userHash = this.hashUserIdentifier(profile.email);
        angulartics2GoogleAnalytics.setUsername(userHash);
      }
    });
  }

  private hashUserIdentifier(identifier: string): string {
    if (identifier) {
      const sha3 = new jsSHA('SHA3-512', 'TEXT');
      sha3.update(identifier);
      return sha3.getHash('HEX');
    }

    return 'unknown';
  }

  private getUserProfileFromKeycloak(): Promise<any> {
    const keycloak = KeycloakService.auth.authz;
    if (!keycloak) {
      return Promise.resolve(null);
    }

    return keycloak.loadUserProfile();
  }

  public ngOnInit() {
    this.setNotificationStyle();
  }

  public setNotificationStyle(): void {
    this.notificationService.setDefaults({
      toast: {
        titleMaxLength: 20,
        backdrop: -1,
        timeout: 3000,
        showProgressBar: false,
        closeOnClick: true,
        pauseOnHover: false
      }
    });
  }

}
