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
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {RouterModule} from '@angular/router';

import {SharedModule} from '../../../../shared/shared.module';
import {EmptyViewsComponent} from './common/empty-views/empty-views.component';
import {ViewDetailComponent} from './common/view-detail/view-detail.component';
import {ViewsFoldersBreadcrumbComponent} from './folders/content/breadcrumb/views-folders-breadcrumb.component';
import {ViewsFolderComponent} from './folders/content/folders/folder/views-folder.component';
import {ViewsFoldersComponent} from './folders/content/folders/views-folders.component';
import {ViewFoldersByPathPipe} from './folders/content/pipes/view-folders-by-path.pipe';
import {ViewsFoldersContentComponent} from './folders/content/views-folders-content.component';
import {SearchViewsFoldersComponent} from './folders/search-views-folders.component';
import {ViewIconSizePipe} from './pipes/view-icon-size.pipe';
import {ViewsPreviewContentComponent} from './preview/content/views-preview-content.component';
import {SearchViewsPreviewComponent} from './preview/search-views-preview.component';

@NgModule({
  imports: [CommonModule, SharedModule, RouterModule],
  declarations: [
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
  ],
  exports: [SearchViewsFoldersComponent, SearchViewsPreviewComponent],
})
export class SearchViewsModule {}
