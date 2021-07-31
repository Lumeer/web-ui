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
import {NgModule} from '@angular/core';
import {MatMenuModule} from '@angular/material/menu';
import {CommonModule} from '@angular/common';
import {ResizableModule} from 'angular-resizable-element';
import {SharedModule} from '../../../../shared/shared.module';
import {TableRowGroupHeaderComponent} from '../body/row-group/header/table-row-group-header.component';
import {TableSharedModule} from '../shared/table-shared.module';
import {TableHeaderAddButtonComponent} from './add-button/table-header-add-button.component';
import {TableCaptionComponent} from './collection/caption/table-caption.component';
import {TableHeaderCollectionComponent} from './collection/table-header-collection.component';
import {TableHiddenColumnComponent} from './column-group/hidden-column/table-hidden-column.component';
import {TableAttributeSuggestionsComponent} from './column-group/single-column/attribute-suggestions/table-attribute-suggestions.component';
import {TableColumnContextMenuComponent} from './column-group/single-column/context-menu/table-column-context-menu.component';
import {TableColumnIconsComponent} from './column-group/single-column/icons/table-column-icons.component';
import {TableColumnInputComponent} from './column-group/single-column/input/table-column-input.component';
import {TableSingleColumnComponent} from './column-group/single-column/table-single-column.component';
import {TableColumnGroupComponent} from './column-group/table-column-group.component';
import {TableHierarchyColumnComponent} from './hierarchy-column/table-hierarchy-column.component';
import {TableLinkInfoComponent} from './link/info/table-link-info.component';
import {TableHeaderLinkComponent} from './link/table-header-link.component';
import {TableHeaderComponent} from './table-header.component';
import {TooltipModule} from 'ngx-bootstrap/tooltip';

@NgModule({
  imports: [
    CommonModule,
    DragDropModule,
    ResizableModule,
    SharedModule,
    TableSharedModule,
    MatMenuModule,
    TooltipModule,
  ],
  declarations: [
    TableAttributeSuggestionsComponent,
    TableCaptionComponent,
    TableColumnContextMenuComponent,
    TableColumnGroupComponent,
    TableColumnIconsComponent,
    TableColumnInputComponent,
    TableHeaderComponent,
    TableHeaderCollectionComponent,
    TableHeaderLinkComponent,
    TableHeaderAddButtonComponent,
    TableHiddenColumnComponent,
    TableHierarchyColumnComponent,
    TableLinkInfoComponent,
    TableRowGroupHeaderComponent,
    TableSingleColumnComponent,
  ],
  exports: [TableHeaderComponent],
})
export class TableHeaderModule {}
