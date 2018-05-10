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
import {RouterModule} from '@angular/router';

import {ClickOutsideModule} from 'ng-click-outside';
import {SnotifyComponent, SnotifyModule, SnotifyService, ToastDefaults} from 'ng-snotify';
import {SharedModule} from '../shared/shared.module';
import {WorkspaceGuard} from '../workspace/workspace.guard';
import {LumeerErrorHandler} from './error/lumeer-error.handler';
import {GuardsModule} from './guards/guards.module';
import {HomeComponent} from './home.component';
import {NotificationService} from './notifications/notification.service';
import {CollectionService} from './rest/collection.service';
import {DocumentService} from './rest/document.service';
import {EventService} from './rest/event.service';
import {GroupService} from './rest/group.service';
import {ImportService} from './rest/import.service';
import {LinkInstanceService} from './rest/link-instance.service';
import {LinkTypeService} from './rest/link-type.service';
import {OrganizationService} from './rest/organization.service';
import {ProjectService} from './rest/project.service';
import {SearchService} from './rest/search.service';
import {UserService} from './rest/user.service';
import {ViewService} from './rest/view.service';
import {AppStoreModule} from './store/app-store.module';

import {TopPanelComponent} from './top-panel/top-panel.component';
import {UserSettingsService} from './user-settings.service';
import {CollectionValidators} from './validators/collection.validators';
import {GlobalService} from './rest/global.service';

@NgModule({
  imports: [
    AppStoreModule,
    CommonModule,
    FormsModule,
    HttpClientModule,
    RouterModule,
    SharedModule,
    SnotifyModule,
    ClickOutsideModule,
    GuardsModule
  ],
  declarations: [
    TopPanelComponent,
    HomeComponent
  ],
  providers: [
    CollectionService,
    DocumentService,
    OrganizationService,
    ProjectService,
    SearchService,
    UserSettingsService,
    ImportService,
    UserService,
    GroupService,
    ViewService,
    LinkInstanceService,
    LinkTypeService,
    EventService,
    GlobalService,
    {provide: ErrorHandler, useClass: LumeerErrorHandler},
    {provide: 'SnotifyToastConfig', useValue: ToastDefaults},
    SnotifyService,
    NotificationService,
    WorkspaceGuard,
    CollectionValidators
  ],
  exports: [
    TopPanelComponent,
    HomeComponent,
    SnotifyComponent
  ]
})
export class CoreModule {

  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule has already been loaded. Import CoreModule only in the AppModule!');
    }
  }

}
