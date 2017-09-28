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
import {SharedModule} from '../../../shared/shared.module';
import {SearchAllComponent} from './all/search-all.component';
import {SearchPerspectiveComponent} from './search-perspective.component';
import {SearchCollectionsComponent} from './collections/search-collections.component';
import {SearchDocumentsComponent} from './documents/search-documents.component';
import {SearchResultsDirective} from './search-results.directive';
import {RouterModule} from '@angular/router';
import {SearchLinksComponent} from './links/search-links.component';
import {SearchViewsComponent} from './views/search-views.component';

@NgModule({
  imports: [
    RouterModule,
    SharedModule
  ],
  declarations: [
    SearchAllComponent,
    SearchCollectionsComponent,
    SearchDocumentsComponent,
    SearchLinksComponent,
    SearchPerspectiveComponent,
    SearchResultsDirective,
    SearchViewsComponent
  ],
  entryComponents: [
    SearchAllComponent,
    SearchCollectionsComponent,
    SearchDocumentsComponent,
    SearchLinksComponent,
    SearchPerspectiveComponent,
    SearchViewsComponent
  ],
  exports: [
    SearchPerspectiveComponent
  ]
})
export class SearchPerspectiveModule {

}
