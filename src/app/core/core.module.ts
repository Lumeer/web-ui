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

import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {ErrorHandler, NgModule, Optional, SkipSelf} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {ClickOutsideModule} from 'ng-click-outside';
import {SharedModule} from '../shared/shared.module';
import {SentryErrorHandler} from './error/sentry.error-handler';
import {GuardsModule} from './guards/guards.module';
import {HomeComponent} from './home.component';
import {NotificationsModule} from './notifications/notifications.module';
import {
  CollectionService,
  DocumentService,
  EventService,
  GroupService,
  ImportService,
  LinkInstanceService,
  LinkTypeService,
  OrganizationService,
  ProjectService,
  SearchService,
  UserService,
  ViewService,
} from './rest';
import {httpInterceptorProviders} from './rest/interceptors/http-interceptors';
import {AppStoreModule} from './store/app-store.module';
import {OrganizationValidators} from './validators/organization.validators';
import {ProjectValidators} from './validators/project.validators';
import {PusherService} from './pusher/pusher.service';
import {VideoService} from './api/video/video.service';
import {UserNotificationsService} from './rest/user-notifications.service';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';

@NgModule({
  imports: [
    AppStoreModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    SharedModule,
    ClickOutsideModule,
    GuardsModule,
    BrowserAnimationsModule,
    NotificationsModule,
    BsDatepickerModule.forRoot(),
  ],
  declarations: [HomeComponent],
  providers: [
    {
      provide: ErrorHandler,
      useClass: SentryErrorHandler,
    },
    httpInterceptorProviders,
    CollectionService,
    DocumentService,
    OrganizationService,
    ProjectService,
    SearchService,
    ImportService,
    UserService,
    GroupService,
    ViewService,
    LinkInstanceService,
    LinkTypeService,
    EventService,
    OrganizationValidators,
    ProjectValidators,
    PusherService,
    VideoService,
    UserNotificationsService,
  ],
  exports: [HomeComponent, NotificationsModule],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule has already been loaded. Import CoreModule only in the AppModule!');
    }
  }
}
