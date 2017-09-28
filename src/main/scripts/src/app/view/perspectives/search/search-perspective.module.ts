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
import {SearchAllComponent} from './results/all/search-all.component';
import {SearchHomeComponent} from './home/search-home.component';
import {SearchResultsComponent} from './results/search-results.component';
import {SearchPerspectiveComponent} from './search-perspective.component';
import {SearchCollectionsComponent} from './results/collections/search-collections.component';
import {SearchDocumentsComponent} from './results/documents/search-documents.component';
import {SearchResultsDirective} from './results/search-results.directive';
import {RouterModule} from '@angular/router';
import {SearchLinksComponent} from './results/links/search-links.component';
import {SearchViewsComponent} from './results/views/search-views.component';

@NgModule({
  imports: [
    RouterModule,
    SharedModule
  ],
  declarations: [
    SearchAllComponent,
    SearchCollectionsComponent,
    SearchDocumentsComponent,
    SearchHomeComponent,
    SearchLinksComponent,
    SearchPerspectiveComponent,
    SearchResultsComponent,
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
