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

import {APP_INITIALIZER, LOCALE_ID, NgModule, TRANSLATIONS, TRANSLATIONS_FORMAT} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Angulartics2Module, Angulartics2Settings} from 'angulartics2';
import {environment} from '../environments/environment';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {CollectionModule} from './collection/collection.module';
import {AuthModule} from './auth/auth.module';
import {CoreModule} from './core/core.module';
import {ViewModule} from './view/view.module';
import {WorkspaceModule} from './workspace/workspace.module';
import {SharedModule} from './shared/shared.module';
import {ConstraintDataService} from './core/service/constraint-data.service';
import {PermissionsCheckService} from './core/service/permissions-check.service';
import {AppIdService} from './core/service/app-id.service';
import {PrintModule} from './print/print.module';

declare const require; // Use the require method provided by webpack

export const angularticsSettings: Partial<Angulartics2Settings> = {
  developerMode: !environment.analytics,
  pageTracking: {
    clearIds: true,
    idsRegExp: new RegExp('^[0-9a-z]{24}$'),
  },
  ga: {
    anonymizeIp: true,
  },
};

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AuthModule,
    CoreModule,
    CollectionModule,
    SharedModule,
    PrintModule,
    ViewModule,
    WorkspaceModule,
    AppRoutingModule, // needs to be declared after all other routing modules
    Angulartics2Module.forRoot(angularticsSettings),
  ],
  providers: [
    {
      provide: LOCALE_ID,
      useFactory: () => environment.locale,
    },
    {
      provide: TRANSLATIONS,
      useFactory: locale => require(`raw-loader!../../src/i18n/messages.${locale}.xlf`).default, // TODO ${environment.i18nPath}
      deps: [LOCALE_ID],
    },
    {
      provide: TRANSLATIONS_FORMAT,
      useFactory: () => environment.i18nFormat,
    },
    I18n,
    ConstraintDataService,
    {
      provide: APP_INITIALIZER,
      useFactory: (ds: ConstraintDataService) => () => ds.init(),
      deps: [ConstraintDataService],
      multi: true,
    },
    PermissionsCheckService,
    {
      provide: APP_INITIALIZER,
      useFactory: (ds: PermissionsCheckService) => () => ds.init(),
      deps: [PermissionsCheckService],
      multi: true,
    },
    AppIdService,
    {
      provide: APP_INITIALIZER,
      useFactory: (ds: AppIdService) => () => ds.init(),
      deps: [AppIdService],
      multi: true,
    },
  ],
  declarations: [AppComponent],
  bootstrap: [AppComponent],
})
export class AppModule {}
