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

import {ErrorHandler, NgModule, Optional, SkipSelf} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';
import {RouterModule} from '@angular/router';

import {WorkspaceService} from './workspace.service';
import {TopPanelComponent} from './top-panel/top-panel.component';
import {UserSettingsService} from './user-settings.service';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';
import {ProjectService} from './rest/project.service';
import {OrganizationService} from './rest/organization.service';
import {CollectionService} from './rest/collection.service';
import {DocumentService} from './rest/document.service';
import {UserService} from './rest/user.service';
import {GroupService} from './rest/group.service';
import {HomeComponent} from './home.component';
import {SharedModule} from '../shared/shared.module';
import {SearchService} from './rest/search.service';
import {LumeerErrorHandler} from './error/lumeer-error.handler';
import {ImportService} from './rest/import.service';
import {KEYCLOAK_HTTP_PROVIDER} from './keycloak/keycloak-http.service';
import {KeycloakService} from './keycloak/keycloak.service';
import {ViewService} from './rest/view.service';
import {SearchHomeComponent} from './search-home/search-home.component';
import {Ng2Webstorage} from 'ng2-webstorage';
import {SearchMockService} from './rest/search-mock.service';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpModule,
    Ng2Webstorage,
    SharedModule,
    HttpClientModule,
    RouterModule
  ],
  declarations: [
    TopPanelComponent,
    HomeComponent,
    PageNotFoundComponent,
    SearchHomeComponent
  ],
  providers: [
    CollectionService,
    DocumentService,
    OrganizationService,
    ProjectService,
    SearchService,
    SearchMockService,
    UserSettingsService,
    WorkspaceService,
    ImportService,
    KeycloakService,
    UserService,
    GroupService,
    ViewService,
    KEYCLOAK_HTTP_PROVIDER,
    {provide: ErrorHandler, useClass: LumeerErrorHandler}
  ],
  exports: [
    TopPanelComponent,
    HomeComponent,
    PageNotFoundComponent,
    SearchHomeComponent
  ]
})
export class CoreModule {

  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule has already been loaded. Import CoreModule only in the AppModule!');
    }
  }

}
