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

import {CommonModule} from '@angular/common';
import {HttpClientModule} from '@angular/common/http';
import {ErrorHandler, NgModule, Optional, SkipSelf} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {RouterModule} from '@angular/router';
import {AlertModule} from 'ngx-bootstrap/alert';
import {BsDatepickerModule} from 'ngx-bootstrap/datepicker';
import {BsDropdownModule} from 'ngx-bootstrap/dropdown';
import {ModalModule} from 'ngx-bootstrap/modal';
import {PopoverModule} from 'ngx-bootstrap/popover';
import {TimepickerModule} from 'ngx-bootstrap/timepicker';
import {TypeaheadModule} from 'ngx-bootstrap/typeahead';
import {SharedModule} from '../shared/shared.module';
import {SentryErrorHandler} from './error/sentry.error-handler';
import {GuardsModule} from './guards/guards.module';
import {HomeComponent} from './components/home.component';
import {NotificationsModule} from './notifications/notifications.module';
import {PusherService} from './pusher/pusher.service';
import {RedirectComponent} from './components/redirect.component';
import {GroupService, ImportService} from './rest';
import {BaseService} from './rest/base.service';
import {httpInterceptorProviders} from './rest/interceptors/http-interceptors';
import {UserNotificationsService} from './rest/user-notifications.service';
import {AppStoreModule} from './store/app-store.module';
import {OrganizationValidators} from './validators/organization.validators';
import {ProjectValidators} from './validators/project.validators';
import {SequenceService} from './rest/sequence.service';
import {AccordionModule} from 'ngx-bootstrap/accordion';
import {TemplateService} from './rest/template.service';
import {DataServiceModule} from './data-service/data-service.module';
import {FullCalendarModule} from '@fullcalendar/angular';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import {DocumentRedirectComponent} from './components/document-redirect.component';

FullCalendarModule.registerPlugins([
  dayGridPlugin,
  timeGridPlugin,
  interactionPlugin,
  listPlugin,
  resourceTimeGridPlugin,
]);

@NgModule({
  imports: [
    AppStoreModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    SharedModule,
    GuardsModule,
    BrowserAnimationsModule,
    NotificationsModule,
    AccordionModule.forRoot(),
    AlertModule.forRoot(),
    BsDatepickerModule.forRoot(),
    BsDropdownModule.forRoot(),
    PopoverModule.forRoot(),
    ModalModule.forRoot(),
    TimepickerModule.forRoot(),
    TypeaheadModule.forRoot(),
    DataServiceModule,
    FullCalendarModule,
  ],
  declarations: [HomeComponent, RedirectComponent, DocumentRedirectComponent],
  providers: [
    {
      provide: ErrorHandler,
      useClass: SentryErrorHandler,
    },
    httpInterceptorProviders,
    TemplateService,
    BaseService,
    ImportService,
    GroupService,
    OrganizationValidators,
    ProjectValidators,
    PusherService,
    UserNotificationsService,
    SequenceService,
  ],
  exports: [HomeComponent, NotificationsModule, RedirectComponent, DocumentRedirectComponent],
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule has already been loaded. Import CoreModule only in the AppModule!');
    }
  }
}
