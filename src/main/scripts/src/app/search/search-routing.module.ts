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
import {RouterModule, Routes} from '@angular/router';
import {CollectionsSearchResultsComponent} from './results/collections/collections-search-results.component';
import {DocumentsSearchResultsComponent} from './results/documents/documents-search-results.component';
import {SearchComponent} from './search.component';
import {AllSearchResultsComponent} from './results/all/all-search-results.component';
import {SearchResultsComponent} from './results/search-results.component';
import {SearchHomeComponent} from './home/search-home.component';

const searchRoutes: Routes = [
  {
    path: 'w/:organizationCode/:projectCode/search',
    component: SearchComponent,
    children: [
      {
        path: '',
        pathMatch: 'full',
        component: SearchHomeComponent,
        data: {
          searchBoxHidden: true
        }
      },
      {
        path: '',
        component: SearchResultsComponent,
        children: [
          {
            path: 'all',
            component: AllSearchResultsComponent
          },
          {
            path: 'collections',
            component: CollectionsSearchResultsComponent
          },
          {
            path: 'documents',
            component: DocumentsSearchResultsComponent
          }
        ]
      }
    ]
  }
];

@NgModule({
  imports: [
    RouterModule.forChild(searchRoutes)
  ],
  exports: [
    RouterModule
  ]
})
export class SearchRoutingModule {

}
