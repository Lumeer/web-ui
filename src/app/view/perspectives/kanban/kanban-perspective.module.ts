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
import {RouterModule} from '@angular/router';

import {InfiniteScrollModule} from 'ngx-infinite-scroll';

import {CollapsibleSidebarModule} from '../../../shared/collapsible-sidebar/collapsible-sidebar.module';
import {DataInputModule} from '../../../shared/data-input/data-input.module';
import {DropdownModule} from '../../../shared/dropdown/dropdown.module';
import {PickerModule} from '../../../shared/picker/picker.module';
import {PipesModule} from '../../../shared/pipes/pipes.module';
import {PostItModule} from '../../../shared/post-it/post-it.module';
import {PresenterModule} from '../../../shared/presenter/presenter.module';
import {SelectModule} from '../../../shared/select/select.module';
import {AttributesSettingsModule} from '../../../shared/settings/attributes/attributes-settings.module';
import {SliderModule} from '../../../shared/slider/slider.module';
import {WarningMessageModule} from '../../../shared/warning-message/warning-message.module';
import {KanbanColumnFooterComponent} from './content/columns/column/footer/kanban-column-footer.component';
import {KanbanColumnHeaderComponent} from './content/columns/column/header/kanban-column-header.component';
import {KanbanColumnComponent} from './content/columns/column/kanban-column.component';
import {KanbanColumnsComponent} from './content/columns/kanban-columns.component';
import {KanbanConfigComponent} from './content/config/kanban-config.component';
import {KanbanAggregationConfigComponent} from './content/config/stem/aggregation/kanban-aggregation-config.component';
import {KanbanStemConfigComponent} from './content/config/stem/kanban-stem-config.component';
import {KanbanContentComponent} from './content/kanban-content.component';
import {KanbanPerspectiveRoutingModule} from './kanban-perspective-routing.module';
import {KanbanPerspectiveComponent} from './kanban-perspective.component';
import {FilterKanbanCardsByPagePipe} from './pipes/filter-kanban-cards-by-page.pipe';
import {IsAnyKanbanAttributeSelectedPipe} from './pipes/is-any-kanban-attribute-selected.pipe';
import {KanbanAggregateSelectItemsPipe} from './pipes/kanban-aggregate-select-items.pipe';
import {KanbanAggregationDefinedPipe} from './pipes/kanban-aggregation-defined.pipe';
import {KanbanCleanAttributePipe} from './pipes/kanban-clean-attribute.pipe';
import {KanbanDragColumnsPipe} from './pipes/kanban-drag-columns.pipe';
import {KanbanDueDateSelectItemsPipe} from './pipes/kanban-due-date-select-items.pipe';
import {KanbanDueHoursTagPipe} from './pipes/kanban-due-hours-tag.pipe';
import {KanbanPostItDraggablePipe} from './pipes/kanban-post-it-draggable.pipe';
import {KanbanSelectDataItemsPipe} from './pipes/kanban-select-data-items.pipe';
import {KanbanSelectedItemPipe} from './pipes/kanban-selected-item.pipe';
import {KanbanValueTypeSelectItemsPipe} from './pipes/kanban-value-type-select-items.pipe';

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
    CommonModule,
    RouterModule,
    KanbanPerspectiveRoutingModule,
    DataInputModule,
    DragDropModule,
    DropdownModule,
    PickerModule,
    PipesModule,
    PresenterModule,
    PostItModule,
    CollapsibleSidebarModule,
    WarningMessageModule,
    SliderModule,
    SelectModule,
    InfiniteScrollModule,
    AttributesSettingsModule,
  ],
  exports: [KanbanPerspectiveComponent],
})
export class KanbanPerspectiveModule {}
