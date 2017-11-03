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

import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';

import {ModalModule} from 'ngx-bootstrap/modal';

import {AppComponent} from './app.component';
import {CoreModule} from './core/core.module';
import {AppRoutingModule} from './app-routing.module';
import {WorkspaceModule} from './workspace/workspace.module';
import {CollectionModule} from './collection/collection.module';
import {DocumentsModule} from './documents/documents.module';
import {SimpleNotificationsModule} from 'angular2-notifications/dist';
import {ViewModule} from './view/view.module';

@NgModule({
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    SimpleNotificationsModule.forRoot(),
    ModalModule.forRoot(),
    CoreModule,
    CollectionModule,
    DocumentsModule,
    ViewModule,
    WorkspaceModule,
    AppRoutingModule // needs to stay last
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
