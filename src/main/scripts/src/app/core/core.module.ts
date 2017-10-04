/*
 * -----------------------------------------------------------------------\
 * Lumeer
 *
 * Copyright (C) since 2016 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * -----------------------------------------------------------------------/
 */

import {ErrorHandler, NgModule, Optional, SkipSelf} from '@angular/core';
import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {FormsModule} from '@angular/forms';
import {HttpModule} from '@angular/http';

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
import {RouterModule} from '@angular/router';
import {LumeerErrorHandler} from './error/lumeer-error.handler';
import {ImportService} from './rest/import.service';
import {KEYCLOAK_HTTP_PROVIDER} from './keycloak/keycloak-http.service';
import {KeycloakService} from './keycloak/keycloak.service';
import {ViewService} from './rest/view.service';
import {SearchHomeComponent} from './search-home/search-home.component';
import {Ng2Webstorage} from 'ng2-webstorage';

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
