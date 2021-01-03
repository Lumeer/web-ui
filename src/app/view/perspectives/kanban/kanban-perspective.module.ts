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
import {KanbanConfigComponent} from './content/config/kanban-config.component';
import {KanbanColumnsComponent} from './content/columns/kanban-columns.component';
import {KanbanStemConfigComponent} from './content/config/stem/kanban-stem-config.component';
import {KanbanColumnComponent} from './content/columns/column/kanban-column.component';
import {KanbanColumnHeaderComponent} from './content/columns/column/header/kanban-column-header.component';
import {KanbanColumnFooterComponent} from './content/columns/column/footer/kanban-column-footer.component';
import {KanbanDragColumnsPipe} from './pipes/kanban-drag-columns.pipe';
import {KanbanPostItDraggablePipe} from './pipes/kanban-post-it-draggable.pipe';
import {PickerModule} from '../../../shared/picker/picker.module';
import {KanbanSelectedItemPipe} from './pipes/kanban-selected-item.pipe';
import {IsAnyKanbanAttributeSelectedPipe} from './pipes/is-any-kanban-attribute-selected.pipe';
import {DropdownModule} from '../../../shared/dropdown/dropdown.module';
import {PresenterModule} from '../../../shared/presenter/presenter.module';
import {KanbanDueDateSelectItemsPipe} from './pipes/kanban-due-date-select-items.pipe';
import {KanbanDueHoursTagPipe} from './pipes/kanban-due-hours-tag.pipe';
import {KanbanSelectDataItemsPipe} from './pipes/kanban-select-data-items.pipe';
import {KanbanAggregationConfigComponent} from './content/config/stem/aggregation/kanban-aggregation-config.component';
import {KanbanValueTypeSelectItemsPipe} from './pipes/kanban-value-type-select-items.pipe';
import {KanbanAggregateSelectItemsPipe} from './pipes/kanban-aggregate-select-items.pipe';
import {KanbanCleanAttributePipe} from './pipes/kanban-clean-attribute.pipe';
import {PostItModule} from '../../../shared/post-it/post-it.module';
import {KanbanAggregationDefinedPipe} from './pipes/kanban-aggregation-defined.pipe';
import {KanbanContentComponent} from './content/kanban-content.component';
import {FilterKanbanCardsByPagePipe} from './pipes/filter-kanban-cards-by-page.pipe';

@NgModule({
  declarations: [
    KanbanPerspectiveComponent,
    KanbanConfigComponent,
    KanbanColumnsComponent,
    KanbanStemConfigComponent,
    KanbanColumnComponent,
    KanbanColumnHeaderComponent,
    KanbanColumnFooterComponent,
    KanbanDragColumnsPipe,
    KanbanPostItDraggablePipe,
    KanbanSelectedItemPipe,
    IsAnyKanbanAttributeSelectedPipe,
    KanbanDueDateSelectItemsPipe,
    KanbanDueHoursTagPipe,
    KanbanSelectDataItemsPipe,
    KanbanAggregationConfigComponent,
    KanbanValueTypeSelectItemsPipe,
    KanbanAggregateSelectItemsPipe,
    KanbanCleanAttributePipe,
    KanbanAggregationDefinedPipe,
    KanbanContentComponent,
    FilterKanbanCardsByPagePipe,
  ],
  imports: [
    SharedModule,
    RouterModule,
    KanbanPerspectiveRoutingModule,
    DataInputModule,
    DragDropModule,
    DropdownModule,
    PickerModule,
    PresenterModule,
    PostItModule,
  ],
  exports: [KanbanPerspectiveComponent],
})
export class KanbanPerspectiveModule {}
