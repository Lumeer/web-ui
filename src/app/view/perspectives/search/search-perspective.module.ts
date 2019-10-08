/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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
import {SharedModule} from '../../../shared/shared.module';
import {SearchBoxModule} from '../../../shared/top-panel/search-box/search-box.module';
import {WarningMessageModule} from '../../../shared/warning-message/warning-message.module';
import {SearchAllComponent} from './all/search-all.component';
import {SearchCollectionsComponent} from './collections/search-collections.component';
import {SearchDocumentsModule} from './documents/search-documents.module';
import {SearchPerspectiveRoutingModule} from './search-perspective-routing.module';
import {SearchPerspectiveComponent} from './search-perspective.component';
import {SearchResultsDirective} from './search-results.directive';
import {EmptyViewsComponent} from './views/content/empty-views/empty-views.component';
import {SearchViewsComponent} from './views/search-views.component';
import {ViewDetailComponent} from './views/content/view-detail/view-detail.component';
import {ContainsDeletedQueryItemPipe} from './views/content/view-detail/contains-deleted-query-item.pipe';
import {SearchViewsContentComponent} from './views/content/search-views-content.component';

@NgModule({
  imports: [
    RouterModule,
    SharedModule,
    SearchBoxModule,
    WarningMessageModule,
    SearchPerspectiveRoutingModule,
    SearchDocumentsModule,
  ],
  declarations: [
    SearchAllComponent,
    SearchCollectionsComponent,
    SearchPerspectiveComponent,
    SearchResultsDirective,
    SearchViewsComponent,
    EmptyViewsComponent,
    ViewDetailComponent,
    ContainsDeletedQueryItemPipe,
    SearchViewsContentComponent,
  ],
  entryComponents: [SearchAllComponent, SearchCollectionsComponent, SearchPerspectiveComponent, SearchViewsComponent],
  exports: [SearchPerspectiveComponent, ViewDetailComponent],
})
export class SearchPerspectiveModule {}
