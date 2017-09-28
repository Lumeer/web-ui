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

import {RouterModule, Routes} from '@angular/router';
import {NgModule} from '@angular/core';

import {PageNotFoundComponent} from './core/page-not-found/page-not-found.component';
import {HomeComponent} from './core/home.component';
import {SearchHomeComponent} from './core/search-home/search-home.component';

const appRoutes: Routes = [
  {
    path: 'w/:organizationCode/:projectCode/search',
    component: SearchHomeComponent,
    data: {
      searchBoxHidden: true
    }
  },
  {
    path: '',
    pathMatch: 'full',
    component: HomeComponent
  },
  {
    path: '**',
    component: PageNotFoundComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(appRoutes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
