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

import {NgModule} from '@angular/core';
import {SharedModule} from '../shared/shared.module';
import {ViewRoutingModule} from './view-routing.module';
import {PerspectiveDirective} from './perspectives/perspective.directive';
import {FormsModule} from '@angular/forms';
import {BrowserModule} from '@angular/platform-browser';
import {SearchPerspectiveModule} from './perspectives/search/search-perspective.module';
import {PostItPerspectiveModule} from './perspectives/post-it/post-it-perspective.module';
import {ViewComponent} from './view.component';
import {TablePerspectiveModule} from './perspectives/table/table-perspective.module';
import {ViewControlsComponent} from './view-controls/view-controls.component';
import {ShareDialogComponent} from './view-controls/share-dialog/share-dialog.component';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    PostItPerspectiveModule,
    SearchPerspectiveModule,
    TablePerspectiveModule,
    SharedModule,
    ViewRoutingModule
  ],
  declarations: [
    PerspectiveDirective,
    ShareDialogComponent,
    ViewComponent,
    ViewControlsComponent
  ]
})
export class ViewModule {

}
