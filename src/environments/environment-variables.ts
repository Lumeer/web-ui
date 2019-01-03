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

let env = {};
try {
  env = require('./.env.json');
} catch (ex) {
  // not needed when `ng serve` is run
}

export interface EnvironmentVariables {
  apiUrl: string;
  authClientId: string;
  authDomain: string;
  buildNumber: string;
  i18nFormat: string;
  locale: string;
  sentryDsn: string;
  sessionTimeout: number;
  pusherCluster: string;
  pusherKey: string;
  videoKey: string;
}

const apiUrl = env['LUMEER_ENGINE'] || 'http://localhost:8080/lumeer-engine';
const authClientId = env['AUTH_CLIENT_ID'] || 'Hjee0La2DjlYjIH5ClCx3Xnfaj02n2On';
const authDomain = env['AUTH_DOMAIN'] || 'lumeer.eu.auth0.com';
const buildNumber = env['BUILD_NUMBER'];
const i18nFormat = env['I18N_FORMAT'];
const locale: string = env['I18N_LOCALE'] || 'en';
const sentryDsn: string = env['SENTRY_DSN'];
const sessionTimeout = Number(env['SESSION_TIMEOUT']) || 30; // minutes
const pusherCluster = env['PUSHER_CLUSTER'] || 'eu';
const pusherKey = env['PUSHER_KEY'] || '';
const videoKey = env['VIDEO_KEY'] || '';

export const environmentVariables: EnvironmentVariables = {
  apiUrl,
  authClientId,
  authDomain,
  buildNumber,
  i18nFormat,
  locale,
  sentryDsn,
  sessionTimeout,
  pusherCluster,
  pusherKey,
  videoKey,
};
