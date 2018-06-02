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

import {KeycloakConfig} from 'keycloak-angular';
import {isNullOrUndefined} from 'util';
import {environment} from '../../environments/environment';

const SETTINGS = require('../../main/webapp/WEB-INF/keycloak.json');

export class KeycloakSettings {

  public static getConfig(): KeycloakConfig {
    return {
      url: SETTINGS['auth-server-url'],
      realm: SETTINGS['realm'],
      clientId: SETTINGS['resource']
    };
  }

  public static getAuthServerUrl(): string {
    return this.getConfig().url;
  }

  public static isDisabled(): boolean {
    return isNullOrUndefined(SETTINGS.disabled) ? !environment.keycloak : SETTINGS.disabled;
  }

}
