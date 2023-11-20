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
import {DragDropModule} from '@angular/cdk/drag-drop';
import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {DataInputModule} from '../../../../shared/data-input/data-input.module';
import {SharedModule} from '../../../../shared/shared.module';
import {EmptyTasksCollectionsWithoutRightsComponent} from './content/empty/collections-without-rights/empty-tasks-collections-without-rights.component';
import {EmptyTasksCollectionsComponent} from './content/empty/collections/empty-tasks-collections.component';
import {EmptyTasksComponent} from './content/empty/empty-tasks.component';
import {EmptyTasksQueryComponent} from './content/empty/query/empty-tasks-query.component';
import {EmptyTasksSearchComponent} from './content/empty/search/empty-tasks-search.component';
import {TasksGroupComponent} from './content/group/tasks-group.component';
import {TaskFirstLineComponent} from './content/group/wrapper/first-line/task-first-line.component';
import {TaskSecondLineComponent} from './content/group/wrapper/second-line/task-second-line.component';
import {TaskWrapperComponent} from './content/group/wrapper/task-wrapper.component';
import {TasksContentComponent} from './content/tasks-content.component';
import {FilterUnusedSortItemsPipe} from './content/toolbar/sort/dropdown/filter-unused-sort-items.pipe';
import {TasksSortDropdownComponent} from './content/toolbar/sort/dropdown/tasks-sort-dropdown.component';
import {TasksSortComponent} from './content/toolbar/sort/tasks-sort.component';
import {TasksToolbarComponent} from './content/toolbar/tasks-toolbar.component';
import {CollectionsTaskAttributesPipe} from './pipes/collections-task-attributes.pipe';
import {CreateTasksGroupsPipe} from './pipes/create-tasks-groups.pipe';
import {DataValueEntriesPipe} from './pipes/data-value-entries.pipe';
import {FilterContributeTasksCollectionsPipe} from './pipes/filter-contribute-tasks-collections.pipe';
import {FilterContributeViewsPipe} from './pipes/filter-contribute-views.pipe';
import {IsDocumentOpenedPipe} from './pipes/is-document-opened.pipe';
import {SearchTasksComponent} from './search-tasks.component';

@NgModule({
  imports: [CommonModule, SharedModule, DataInputModule, DragDropModule],
  declarations: [
    SearchTasksComponent,
    EmptyTasksComponent,
    TaskWrapperComponent,
    IsDocumentOpenedPipe,
    DataValueEntriesPipe,
    TasksContentComponent,
    FilterContributeTasksCollectionsPipe,
    FilterContributeViewsPipe,
    TasksToolbarComponent,
    CollectionsTaskAttributesPipe,
    EmptyTasksQueryComponent,
    EmptyTasksSearchComponent,
    EmptyTasksCollectionsComponent,
    EmptyTasksCollectionsWithoutRightsComponent,
    TaskFirstLineComponent,
    TaskSecondLineComponent,
    CreateTasksGroupsPipe,
    TasksGroupComponent,
    TasksSortComponent,
    TasksSortDropdownComponent,
    FilterUnusedSortItemsPipe,
  ],
  exports: [SearchTasksComponent],
})
export class SearchTasksModule {}
