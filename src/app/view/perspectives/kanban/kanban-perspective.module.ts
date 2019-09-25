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
import {KanbanStemConfigComponent} from './config/stem/kanban-stem-config.component';
import {KanbanColumnComponent} from './columns/column/kanban-column.component';
import {KanbanColumnHeaderComponent} from './columns/column/header/kanban-column-header.component';
import {KanbanColumnFooterComponent} from './columns/column/footer/kanban-column-footer.component';
import {KanbanColumnCardsPipe} from './pipes/kanban-column-cards.pipe';
import {KanbanDragColumnsPipe} from './pipes/kanban-drag-columns.pipe';
import {KanbanPostItDraggablePipe} from './pipes/kanban-post-it-draggable.pipe';
import {FilterWritableResourcesPipe} from './pipes/filter-writable-resources.pipe';
import {PickerModule} from '../../../shared/picker/picker.module';
import {KanbanSelectedItemPipe} from './pipes/kanban-selected-item.pipe';
import {KanbanRestrictedSelectItemIdsPipe} from './pipes/kanban-restricted-select-item-ids.pipe';
import {DropdownModule} from '../../../shared/dropdown/dropdown.module';
import {ChooseLinkDocumentModalComponent} from './modal/choose-link-document/choose-link-document-modal.component';
import {ModalModule as NgxModalModule} from 'ngx-bootstrap/modal';
import {PreviewResultsModule} from '../../../shared/preview-results/preview-results.module';
import {ModalWrapperModule} from '../../../shared/modal/wrapper/modal-wrapper.module';
import {PresenterModule} from '../../../shared/presenter/presenter.module';
import {KanbanDueDateSelectItemsPipe} from './pipes/kanban-due-date-select-items.pipe';
import {KanbanDueHoursTagPipe} from './pipes/kanban-due-hours-tag.pipe';
import {KanbanColumnTitlesPipe} from './pipes/kanban-column-titles.pipe';
import {KanbanSelectDataItemsPipe} from './pipes/kanban-select-data-items.pipe';

@NgModule({
  declarations: [
    KanbanPerspectiveComponent,
    KanbanConfigComponent,
    KanbanColumnsComponent,
    KanbanStemConfigComponent,
    KanbanColumnComponent,
    KanbanColumnHeaderComponent,
    KanbanColumnFooterComponent,
    KanbanColumnCardsPipe,
    KanbanDragColumnsPipe,
    KanbanPostItDraggablePipe,
    FilterWritableResourcesPipe,
    KanbanSelectedItemPipe,
    KanbanRestrictedSelectItemIdsPipe,
    ChooseLinkDocumentModalComponent,
    KanbanDueDateSelectItemsPipe,
    KanbanDueHoursTagPipe,
    KanbanColumnTitlesPipe,
    KanbanSelectDataItemsPipe,
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
    PreviewResultsModule,
    ModalWrapperModule,
    NgxModalModule.forRoot(),
  ],
  entryComponents: [KanbanPerspectiveComponent, ChooseLinkDocumentModalComponent],
  exports: [KanbanPerspectiveComponent],
})
export class KanbanPerspectiveModule {}
