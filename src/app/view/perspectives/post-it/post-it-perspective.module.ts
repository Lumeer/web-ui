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

import {SharedModule} from '../../../shared/shared.module';
import {PostItAddDocumentComponent} from './add-document/add-document.component';
import {PostItDocumentComponent} from './document/post-it-document.component';
import {PostItPerspectiveComponent} from './post-it-perspective.component';
import {PostItDocumentHeaderComponent} from './document/post-it-document-header/post-it-document-header.component';
import {PostItDocumentCellComponent} from './document/post-it-document-cell/post-it-document-cell.component';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {PostItColumnStylePipe} from './pipes/post-it-column-style';
import {DocumentCollectionPipe} from './pipes/document-collection.pipe';
import {EmptyPostItsComponent} from './empty-post-its/empty-post-its.component';

@NgModule({
  imports: [SharedModule, RouterModule, InfiniteScrollModule],
  declarations: [
    PostItAddDocumentComponent,
    PostItDocumentComponent,
    PostItPerspectiveComponent,
    PostItDocumentHeaderComponent,
    PostItDocumentCellComponent,
    PostItColumnStylePipe,
    DocumentCollectionPipe,
    EmptyPostItsComponent,
  ],
  entryComponents: [PostItPerspectiveComponent],
  exports: [PostItPerspectiveComponent],
})
export class PostItPerspectiveModule {}
