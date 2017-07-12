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
import {SearchRoutingModule} from './search-routing.module';
import {SearchComponent} from './search.component';
import {SearchAllComponent} from './all/search-all.component';
import {CollectionsSearchComponent} from './collections/collections-search.component';
import {DocumentsSearchComponent} from './documents/documents-search.component';

@NgModule({
  imports: [
    SharedModule,
    SearchRoutingModule
  ],
  declarations: [
    SearchComponent,
    SearchAllComponent,
    CollectionsSearchComponent,
    DocumentsSearchComponent
  ]
})
export class SearchModule {

}
