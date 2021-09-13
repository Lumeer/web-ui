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
import {SearchTasksModule} from './tasks/search-tasks.module';
import {SearchPerspectiveRoutingModule} from './search-perspective-routing.module';
import {SearchPerspectiveComponent} from './search-perspective.component';
import {EmptyViewsComponent} from './views/common/empty-views/empty-views.component';
import {ViewDetailComponent} from './views/common/view-detail/view-detail.component';
import {CreateDocumentModalModule} from '../../../shared/modal/create-document/create-document-modal.module';
import {SearchPerspectiveRedirectGuard} from './search-perspective-redirect.guard';
import {ViewIconSizePipe} from './views/pipes/view-icon-size.pipe';
import {SearchViewsPreviewComponent} from './views/preview/search-views-preview.component';
import {SearchViewsFoldersComponent} from './views/folders/search-views-folders.component';
import {ViewsPreviewContentComponent} from './views/preview/content/views-preview-content.component';
import {ViewsFoldersContentComponent} from './views/folders/content/views-folders-content.component';
import {ViewsFoldersComponent} from './views/folders/content/folders/views-folders.component';
import {ViewsFolderComponent} from './views/folders/content/folders/folder/views-folder.component';
import {ViewFoldersByPathPipe} from './views/folders/content/pipes/view-folders-by-path.pipe';
import {ViewsFoldersBreadcrumbComponent} from './views/folders/content/breadcrumb/views-folders-breadcrumb.component';
import {DragDropModule} from '@angular/cdk/drag-drop';
import {DashboardTabComponent} from './dashboard/dashboard-tab.component';
import {DashboardTabContentComponent} from './dashboard/content/dashboard-tab-content.component';
import {DashboardTabRowContentComponent} from './dashboard/content/row/dashboard-tab-row-content.component';
import {DashboardTabCellContentComponent} from './dashboard/content/row/cell/dashboard-tab-cell-content.component';
import {PerspectivePreviewModule} from '../preview/perspective-preview.module';

@NgModule({
  imports: [
    RouterModule,
    SharedModule,
    SearchBoxModule,
    WarningMessageModule,
    SearchPerspectiveRoutingModule,
    SearchTasksModule,
    CreateDocumentModalModule,
    DragDropModule,
    PerspectivePreviewModule,
  ],
  declarations: [
    SearchAllComponent,
    SearchCollectionsComponent,
    SearchPerspectiveComponent,
    SearchViewsPreviewComponent,
    SearchViewsFoldersComponent,
    ViewsPreviewContentComponent,
    ViewsFoldersContentComponent,
    EmptyViewsComponent,
    ViewDetailComponent,
    ViewIconSizePipe,
    ViewsFoldersComponent,
    ViewsFolderComponent,
    ViewFoldersByPathPipe,
    ViewsFoldersBreadcrumbComponent,
    DashboardTabComponent,
    DashboardTabContentComponent,
    DashboardTabRowContentComponent,
    DashboardTabCellContentComponent,
  ],
  exports: [SearchPerspectiveComponent, ViewDetailComponent],
  providers: [SearchPerspectiveRedirectGuard],
})
export class SearchPerspectiveModule {}
