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
  buildNumber: number;
  i18nFormat: string;
  locale: string;
  sentryDsn: string;

}

const apiUrl = env['LUMEER_ENGINE'] || 'engine';
const buildNumber: number = env['BUILD_NUMBER'];
const i18nFormat = env['I18N_FORMAT'];
const locale: string = env['I18N_LOCALE'] || 'en';
const sentryDsn: string = env['SENTRY_DSN'];

export const environmentVariables: EnvironmentVariables = {

  apiUrl,
  buildNumber,
  i18nFormat,
  locale,
  sentryDsn

};
