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

let env = {};
try {
  env = require('./.env.json');
} catch (ex) {
  // not needed when `ng serve` is run
}

export interface EnvironmentVariables {
  apiUrl: string;
  apiProdUrl: string;
  pageUrl: string;
  authClientId: string;
  authDomain: string;
  buildNumber: string;
  i18nFormat: string;
  locale: string;
  mapboxKey: string;
  mapQuestKey: string;
  mapTilerKey: string;
  maxFileUploadSize: number;
  presignedUrlTimeout: number;
  sentryDsn: string;
  sessionTimeout: number;
  pusherCluster: string;
  pusherKey: string;
  blocklyCdn: string;
  publicViewCdn: string;
  publicScriptCdn: string;
  logzioKey: string;
  logzioRegion: string;
  smartlookKey: string;
  mixpanelKey: string;
  contactUrl: string;
}

const apiUrl = env['LUMEER_ENGINE'] || 'http://localhost:8080/lumeer-engine';
const apiProdUrl = env['LUMEER_ENGINE_PROD'] || 'https://get.lumeer.io/lumeer-engine';
const pageUrl = env['LUMEER_PAGE'] || 'https://www.lumeer.io';
const authClientId = env['AUTH_CLIENT_ID'] || 'Hjee0La2DjlYjIH5ClCx3Xnfaj02n2On';
const authDomain = env['AUTH_DOMAIN'] || 'lumeer.eu.auth0.com';
const buildNumber = env['BUILD_NUMBER'];
const i18nFormat = env['I18N_FORMAT'];
const locale: string = env['I18N_LOCALE'] || 'en';
const mapboxKey: string = env['MAPBOX_KEY'];
const mapQuestKey: string = env['MAPQUEST_KEY'];
const mapTilerKey: string = env['MAPTILER_KEY'];
const maxFileUploadSize = Number(env['MAX_FILE_UPLOAD_SIZE']) || 10; // MB
const presignedUrlTimeout = Number(env['PRESIGNED_URL_TIMEOUT']) || 60; // seconds
const sentryDsn: string = env['SENTRY_DSN'];
const sessionTimeout = Number(env['SESSION_TIMEOUT']) || 30; // minutes
const pusherCluster = env['PUSHER_CLUSTER'] || 'eu';
const pusherKey = env['PUSHER_KEY'] || '';
const blocklyCdn = env['BLOCKLY_CDN'] || `https://d1p6nuvm5rqwq0.cloudfront.net/blockly/v22/blockly.${locale}.min.js`;
const publicViewCdn = env['PUBLIC_VIEW_CDN'] || `https://d2b894al51csxx.cloudfront.net/${locale}/index.html`;
const publicScriptCdn = env['PUBLIC_SCRIPT_CDN'] || `https://d2b894al51csxx.cloudfront.net/${locale}/public-view.js`;
const logzioKey = env['LOGZIO_KEY'] || '';
const logzioRegion = env['LOGZIO_REGION'] || 'eu';
const smartlookKey = env['SMARTLOOK_KEY'] || '';
const mixpanelKey = env['MIXPANEL_KEY'] || '';
const contactUrl = locale === 'en' ? 'https://www.lumeer.io/contact/' : 'https://www.lumeer.io/cs/kontakt/';

export const environmentVariables: EnvironmentVariables = {
  apiUrl,
  pageUrl,
  apiProdUrl,
  authClientId,
  authDomain,
  buildNumber,
  i18nFormat,
  locale,
  mapboxKey,
  mapQuestKey,
  mapTilerKey,
  maxFileUploadSize,
  presignedUrlTimeout,
  sentryDsn,
  sessionTimeout,
  pusherCluster,
  pusherKey,
  blocklyCdn,
  publicViewCdn,
  publicScriptCdn,
  logzioKey,
  logzioRegion,
  smartlookKey,
  mixpanelKey,
  contactUrl,
};
