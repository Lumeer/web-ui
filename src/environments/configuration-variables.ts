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

export interface ConfigurationVariables {
  apiUrl: string;
  apiProdUrl: string;
  pageUrl: string;
  authClientId: string;
  authDomain: string;
  buildNumber: string;
  i18nFormat: string;
  i18nPath: string;
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
