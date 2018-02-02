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

import {KeycloakService} from 'keycloak-angular';
import {isNullOrUndefined} from 'util';

function isKeycloakDisabled({disabled}): boolean {
  return isNullOrUndefined(disabled) ? LUMEER_ENV === 'development' : disabled;
}

async function initKeycloak(keycloak: KeycloakService, settings: any): Promise<any> {
  return keycloak.init({
    config: {
      url: settings['auth-server-url'],
      realm: settings['realm'],
      clientId: settings['resource']
    }
  });
}

export function appInitializer(keycloak: KeycloakService): () => Promise<any> {
  return (): Promise<any> => {
    return new Promise(async (resolve, reject) => {
      try {
        let keycloakSettings = require('../main/webapp/WEB-INF/keycloak.json');
        if (!isKeycloakDisabled(keycloakSettings)) {
          await initKeycloak(keycloak, keycloakSettings);
        }
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  };
}
