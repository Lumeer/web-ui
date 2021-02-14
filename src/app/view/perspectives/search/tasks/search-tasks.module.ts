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
import {CommonModule} from '@angular/common';

import {SharedModule} from '../../../../shared/shared.module';
import {SearchTasksComponent} from './search-tasks.component';
import {EmptyTasksComponent} from './content/empty-documents/empty-tasks.component';
import {SearchTaskHeaderComponent} from './content/header/search-task-header.component';
import {IsDocumentOpenedPipe} from './pipes/is-document-opened.pipe';
import {DataValueEntriesPipe} from './pipes/data-value-entries.pipe';
import {SearchTasksContentComponent} from './content/search-tasks-content.component';
import {FilterWritableTasksCollectionsPipe} from './pipes/filter-writable-tasks-collections.pipe';
import {DataInputModule} from '../../../../shared/data-input/data-input.module';
import {SearchTasksToolbarComponent} from './content/toolbar/search-tasks-toolbar.component';
import {CollectionsTaskAttributesPipe} from './pipes/collections-task-attributes.pipe';

@NgModule({
  imports: [CommonModule, SharedModule, DataInputModule],
  declarations: [
    SearchTasksComponent,
    EmptyTasksComponent,
    SearchTaskHeaderComponent,
    IsDocumentOpenedPipe,
    DataValueEntriesPipe,
    SearchTasksContentComponent,
    FilterWritableTasksCollectionsPipe,
    SearchTasksToolbarComponent,
    CollectionsTaskAttributesPipe,
  ],
  exports: [SearchTasksComponent],
})
export class SearchTasksModule {}
