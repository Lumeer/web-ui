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
import {RouterModule} from '@angular/router';
import {SearchBoxModule} from '../../../shared/top-panel/search-box/search-box.module';
import {SharedModule} from '../../../shared/shared.module';
import {PostItPerspectiveModule} from '../post-it/post-it-perspective.module';
import {SearchAllComponent} from './all/search-all.component';
import {SearchCollectionsComponent} from './collections/search-collections.component';
import {SearchDocumentsComponent} from './documents/search-documents.component';
import {SearchLinksComponent} from './links/search-links.component';
import {SearchPerspectiveRoutingModule} from './search-perspective-routing.module';
import {SearchPerspectiveComponent} from './search-perspective.component';
import {SearchResultsDirective} from './search-results.directive';
import {SearchViewsComponent} from './views/search-views.component';
import {ViewDetailComponent} from './views/view-detail/view-detail.component';
import {SearchDocumentHeaderComponent} from './documents/header/search-document-header.component';
import {WarningMessageModule} from '../../../shared/warning-message/warning-message.module';

@NgModule({
  imports: [
    RouterModule,
    SharedModule,
    PostItPerspectiveModule,
    SearchBoxModule,
    WarningMessageModule,
    SearchPerspectiveRoutingModule
  ],
  declarations: [
    SearchAllComponent,
    SearchCollectionsComponent,
    SearchDocumentsComponent,
    SearchLinksComponent,
    SearchPerspectiveComponent,
    SearchDocumentHeaderComponent,
    SearchResultsDirective,
    SearchViewsComponent,
    ViewDetailComponent
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
    SearchPerspectiveComponent,
    ViewDetailComponent
  ]
})
export class SearchPerspectiveModule {

}

export default SearchPerspectiveModule;
