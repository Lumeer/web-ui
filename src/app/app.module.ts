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

import {APP_INITIALIZER, NgModule, TRANSLATIONS, TRANSLATIONS_FORMAT} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Angulartics2Module, Angulartics2Settings} from 'angulartics2';
import {Angulartics2GoogleAnalytics} from 'angulartics2/ga';
import {KeycloakAngularModule, KeycloakService} from 'keycloak-angular';
import {ContextMenuModule} from 'ngx-contextmenu';
import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {appInitializer} from './app.initializer';
import {CollectionModule} from './collection/collection.module';
import {CoreModule} from './core/core.module';
import {DocumentsModule} from './documents/documents.module';
import {ViewModule} from './view/view.module';
import {WorkspaceModule} from './workspace/workspace.module';
import { DialogModule } from './dialog/dialog.module';

declare const require; // Use the require method provided by webpack
const translations = require(`raw-loader!../../${I18N_PATH}`);

export const angularticsSettings: Partial<Angulartics2Settings> = {
  developerMode: LUMEER_ENV !== 'production',
  pageTracking: {
    clearIds: true,
    idsRegExp: new RegExp('^[0-9a-z]{24}$')
  },
  ga: {
    anonymizeIp: true
  }
};

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ContextMenuModule.forRoot({useBootstrap4: true}),
    CoreModule,
    CollectionModule,
    DialogModule,
    DocumentsModule,
    KeycloakAngularModule,
    ViewModule,
    WorkspaceModule,
    AppRoutingModule, // needs to be declared after all other routing modules
    Angulartics2Module.forRoot([Angulartics2GoogleAnalytics], angularticsSettings)
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializer,
      multi: true,
      deps: [KeycloakService]
    },
    {
      provide: TRANSLATIONS,
      useFactory: () => translations
    },
    {
      provide: TRANSLATIONS_FORMAT,
      useValue: I18N_FORMAT
    },
    I18n
  ],
  declarations: [
    AppComponent
  ],
  bootstrap: [
    AppComponent
  ]
})
export class AppModule {
}
