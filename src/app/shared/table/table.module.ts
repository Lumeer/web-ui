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
import {DragDropModule} from '@angular/cdk/drag-drop';
import {ScrollingModule} from '@angular/cdk/scrolling';
import {MatMenuModule} from '@angular/material/menu';

import {TableComponent} from './table.component';
import {TableHeaderComponent} from './content/header/table-header.component';
import {TableRowComponent} from './content/row/table-row.component';
import {DataInputModule} from '../data-input/data-input.module';
import {PipesModule} from '../pipes/pipes.module';
import {ColumnHandleLeftPipe} from './pipes/column-handle-left.pipe';
import {TableItemSizeDirective} from './strategy/table-item-size-directive';
import {TableAlternativeHeaderComponent} from './content/alternative-header/table-alternative-header.component';
import {TableResizeHeaderComponent} from './content/resize-header/table-resize-header.component';
import {TableRowDataCursorPipe} from './pipes/table-row-data-cursor.pipe';
import {InputModule} from '../input/input.module';
import {TableCellSelectedPipe} from './pipes/table-cell-selected.pipe';
import {TableCellEditedPipe} from './pipes/table-cell-edited.pipe';
import {TableBodyCellSelectedPipe} from './pipes/table-body-cell-selected.pipe';
import {TableHeaderInputComponent} from './content/header/cell/input/table-header-input.component';
import {TableHeaderCellComponent} from './content/header/cell/table-header-cell.component';
import {TableHeaderHiddenComponent} from './content/header/cell/hidden/table-header-hidden.component';
import {GroupTableColumnsPipe} from './pipes/group-table-columns.pipe';
import {TableHeaderHiddenMenuComponent} from './content/header/cell/hidden-menu/table-header-hidden-menu.component';
import {ColumnHeaderRestrictedNamesPipe} from './pipes/column-header-restricted-names.pipe';
import {ResizableSidebarModule} from '../resizable-sidebar/resizable-sidebar.module';
import {TableNewRowComponent} from './new-row/table-new-row.component';
import {DocumentHintsModule} from '../document-hints/document-hints.module';
import {DocumentHintsColumnsPipe} from './pipes/document-hints-columns.pipe';
import {CalculateHintsOffsetPipe} from './pipes/calculate-hints-offset.pipe';
import {DirectivesModule} from '../directives/directives.module';
import {MenuModule} from '../menu/menu.module';
import {ResourceCommentsModule} from '../resource-comments/resource-comments.module';
import {TooltipModule} from 'ngx-bootstrap/tooltip';
import {CellFilterBuilderComponent} from './content/header/cell/filter-builder/cell-filter-builder.component';
import {DropdownModule} from '../dropdown/dropdown.module';
import {FilterBuilderModule} from '../builder/filter-builder/filter-builder.module';
import {FilterPreviewModule} from '../builder/filter-preview/filter-preview.module';
import {TableCellAffectedPipe} from './pipes/table-cell-affected.pipe';

@NgModule({
  declarations: [
    TableComponent,
    TableHeaderComponent,
    TableRowComponent,
    ColumnHandleLeftPipe,
    TableItemSizeDirective,
    TableAlternativeHeaderComponent,
    TableResizeHeaderComponent,
    TableRowDataCursorPipe,
    TableCellSelectedPipe,
    TableCellEditedPipe,
    TableCellAffectedPipe,
    TableBodyCellSelectedPipe,
    TableHeaderInputComponent,
    TableHeaderCellComponent,
    TableHeaderHiddenComponent,
    GroupTableColumnsPipe,
    TableHeaderHiddenMenuComponent,
    ColumnHeaderRestrictedNamesPipe,
    TableNewRowComponent,
    DocumentHintsColumnsPipe,
    CalculateHintsOffsetPipe,
    CellFilterBuilderComponent,
  ],
  imports: [
    CommonModule,
    DataInputModule,
    PipesModule,
    DragDropModule,
    ScrollingModule,
    InputModule,
    DirectivesModule,
    ResizableSidebarModule,
    MatMenuModule,
    DocumentHintsModule,
    MenuModule,
    ResourceCommentsModule,
    TooltipModule,
    DropdownModule,
    FilterBuilderModule,
    FilterPreviewModule,
  ],
  exports: [TableComponent],
})
export class TableModule {}
