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
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';

import {PermissionsComponent} from './permissions/permissions.component';
import {PermissionsTableComponent} from './permissions/table/permissions-table.component';
import {SearchBoxComponent} from './search-box/search-box.component';
import {TableModule} from './table/table.module';
import {PostItCollectionsComponent} from './post-it-collections/post-it-collections.component';
import {PickerModule} from './picker/picker.module';
import {RouterModule} from '@angular/router';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    PickerModule
  ],
  declarations: [
    PermissionsComponent,
    PermissionsTableComponent,
    PostItCollectionsComponent,
    SearchBoxComponent
  ],
  exports: [
    CommonModule,
    FormsModule,
    PermissionsComponent,
    PostItCollectionsComponent,
    SearchBoxComponent,
    TableModule
  ]
})
export class SharedModule {

}
