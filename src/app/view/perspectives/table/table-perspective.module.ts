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
import {EffectsModule} from '@ngrx/effects';
import {StoreModule} from '@ngrx/store';
import {ResizableModule} from 'angular-resizable-element';
import {ClickOutsideModule} from 'ng-click-outside';
import {ContextMenuModule} from 'ngx-contextmenu';
import {InfiniteScrollModule} from 'ngx-infinite-scroll';
import {TablesEffects} from '../../../core/store/tables/tables.effects';
import {tablesReducer} from '../../../core/store/tables/tables.reducer';
import {initialTablesState, TABLE_FEATURE_NAME} from '../../../core/store/tables/tables.state';
import {PickerModule} from '../../../shared/picker/picker.module';
import {PipesModule} from '../../../shared/pipes/pipes.module';
import {SharedModule} from '../../../shared/shared.module';
import {TableRowGroupFooterComponent} from './body/row-group/footer/table-row-group-footer.component';
import {TableRowGroupHeaderComponent} from './body/row-group/header/table-row-group-header.component';
import {TableRowGroupComponent} from './body/row-group/table-row-group.component';
import {TableCollapsedCellComponent} from './body/rows/row/cell-group/collapsed-cell/table-collapsed-cell.component';
import {TableDataCellMenuComponent} from './body/rows/row/cell-group/data-cell/menu/table-data-cell-menu.component';
import {TableDataCellComponent} from './body/rows/row/cell-group/data-cell/table-data-cell.component';
import {TableCellGroupComponent} from './body/rows/row/cell-group/table-cell-group.component';
import {TableLinkCellComponent} from './body/rows/row/link-cell/table-link-cell.component';
import {TableRowNumbersComponent} from './body/rows/row/row-numbers/table-row-numbers.component';
import {TableRowComponent} from './body/rows/row/table-row.component';
import {TableRowsComponent} from './body/rows/table-rows.component';
import {TableBodyComponent} from './body/table-body.component';
import {TableCaptionComponent} from './header/collection/caption/table-caption.component';
import {TableHeaderCollectionComponent} from './header/collection/table-header-collection.component';
import {TableHiddenColumnComponent} from './header/column-group/hidden-column/table-hidden-column.component';
import {TableAttributeSuggestionsComponent} from './header/column-group/single-column/attribute-suggestions/table-attribute-suggestions.component';
import {TableColumnContextMenuComponent} from './header/column-group/single-column/context-menu/table-column-context-menu.component';
import {TableSingleColumnComponent} from './header/column-group/single-column/table-single-column.component';
import {TableColumnGroupComponent} from './header/column-group/table-column-group.component';
import {TableLinkInfoComponent} from './header/link/info/table-link-info.component';
import {TableHeaderLinkComponent} from './header/link/table-header-link.component';
import {TableHeaderComponent} from './header/table-header.component';
import {TableDataCellDirective} from './shared/directives/table-data-cell.directive';
import {TableEditableCellDirective} from './shared/directives/table-editable-cell.directive';
import {TablePipesModule} from './shared/pipes/table-pipes.module';
import {TablePerspectiveRoutingModule} from './table-perspective-routing.module';
import {TablePerspectiveComponent} from './table-perspective.component';

@NgModule({
  imports: [
    SharedModule,
    PickerModule,
    PipesModule,
    StoreModule.forFeature(TABLE_FEATURE_NAME, tablesReducer, {initialState: initialTablesState}),
    EffectsModule.forFeature([TablesEffects]),
    ContextMenuModule,
    ClickOutsideModule,
    ResizableModule,
    InfiniteScrollModule,
    TablePipesModule,
    TablePerspectiveRoutingModule
  ],
  declarations: [
    TablePerspectiveComponent,
    TableHeaderComponent,
    TableHeaderCollectionComponent,
    TableHeaderLinkComponent,
    TableCaptionComponent,
    TableColumnGroupComponent,
    TableSingleColumnComponent,
    TableLinkInfoComponent,
    TableHiddenColumnComponent,
    TableColumnContextMenuComponent,
    TableAttributeSuggestionsComponent,
    TableBodyComponent,
    TableRowGroupComponent,
    TableRowGroupHeaderComponent,
    TableRowGroupFooterComponent,
    TableRowComponent,
    TableCellGroupComponent,
    TableLinkCellComponent,
    TableRowsComponent,
    TableDataCellMenuComponent,
    TableCollapsedCellComponent,
    TableRowNumbersComponent,
    TableEditableCellDirective,
    TableDataCellDirective,
    TableDataCellComponent,
  ],
  exports: [
    TablePerspectiveComponent
  ]
})
export class TablePerspectiveModule {
}
