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
import {DragDropModule} from '@angular/cdk/drag-drop';

import {KanbanPerspectiveComponent} from './kanban-perspective.component';
import {DataInputModule} from '../../../shared/data-input/data-input.module';
import {SharedModule} from '../../../shared/shared.module';
import {KanbanPerspectiveRoutingModule} from './kanban-perspective-routing.module';
import {KanbanConfigComponent} from './config/kanban-config.component';
import {KanbanColumnsComponent} from './columns/kanban-columns.component';
import {KanbanCollectionConfigComponent} from './config/collection/kanban-collection-config.component';
import {KanbanColumnComponent} from './columns/column/kanban-column.component';
import {KanbanColumnHeaderComponent} from './columns/column/header/kanban-column-header.component';
import {KanbanColumnFooterComponent} from './columns/column/footer/kanban-column-footer.component';
import {KanbanColumnDocumentsPipe} from './pipes/kanban-column-documents.pipe';
import {KanbanDragColumnsPipe} from './pipes/kanban-drag-columns.pipe';
import {KanbanPostItDraggablePipe} from './pipes/kanban-post-it-draggable.pipe';
import {BsDropdownModule} from 'ngx-bootstrap';
import {FilterWritableCollectionsPipe} from './pipes/filter-writable-collections.pipe';
import {PickerModule} from '../../../shared/picker/picker.module';

@NgModule({
  declarations: [
    KanbanPerspectiveComponent,
    KanbanConfigComponent,
    KanbanColumnsComponent,
    KanbanCollectionConfigComponent,
    KanbanColumnComponent,
    KanbanColumnHeaderComponent,
    KanbanColumnFooterComponent,
    KanbanColumnDocumentsPipe,
    KanbanDragColumnsPipe,
    KanbanPostItDraggablePipe,
    FilterWritableCollectionsPipe,
  ],
  imports: [
    SharedModule,
    RouterModule,
    KanbanPerspectiveRoutingModule,
    DataInputModule,
    DragDropModule,
    BsDropdownModule,
    PickerModule,
  ],
  entryComponents: [KanbanPerspectiveComponent],
  exports: [KanbanPerspectiveComponent],
})
export class KanbanPerspectiveModule {}
