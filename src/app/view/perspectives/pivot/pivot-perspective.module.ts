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
import {RouterModule} from '@angular/router';

import {LmrPivotTableModule} from '@lumeer/pivot';

import {DataInputModule} from '../../../shared/data-input/data-input.module';
import {SharedModule} from '../../../shared/shared.module';
import {PivotAttributeSelectItemPipe} from './pipe/pivot-attribute-select-item.pipe';
import {PivotCellClickablePipe} from './pipe/pivot-cell-clickable.pipe';
import {PivotCellConfigurationPipe} from './pipe/pivot-cell-configuration.pipe';
import {PivotCleanAttributePipe} from './pipe/pivot-clean-attribute.pipe';
import {PivotDataEmptyPipe} from './pipe/pivot-data-empty.pipe';
import {PivotHeaderCanSetStickyPipe} from './pipe/pivot-header-can-set-sticky.pipe';
import {PivotHeaderMapAttributePipe} from './pipe/pivot-header-map-attribute.pipe';
import {PivotHeaderRestrictedAttributesPipe} from './pipe/pivot-header-restricted-attributes.pipe';
import {PivotSortSelectItemsPipe} from './pipe/pivot-sort-select-items.pipe';
import {PivotSortSelectedIdPipe} from './pipe/pivot-sort-selected-id.pipe';
import {PivotSubSortSelectItemsPipe} from './pipe/pivot-sub-sort-select-items.pipe';
import {PivotSubSortValuesPipe} from './pipe/pivot-sub-sort-values.pipe';
import {PivotTableCellHasValuePipe} from './pipe/pivot-table-value.pipe';
import {PivotValueTypeSelectItemsPipe} from './pipe/pivot-value-type-select-items.pipe';
import {PivotPerspectiveRoutingModule} from './pivot-perspective-routing.module';
import {PivotPerspectiveComponent} from './pivot-perspective.component';
import {PivotConfigWrapperComponent} from './wrapper/config/pivot-config-wrapper.component';
import {PivotHeaderAttributeConfigComponent} from './wrapper/config/stem-config/attribute/header/pivot-header-attribute-config.component';
import {PivotAttributeSortComponent} from './wrapper/config/stem-config/attribute/header/sort/pivot-attribute-sort.component';
import {PivotValueAttributeConfigComponent} from './wrapper/config/stem-config/attribute/value/pivot-value-attribute-config.component';
import {PivotConfigComponent} from './wrapper/config/stem-config/pivot-config.component';
import {PivotPerspectiveWrapperComponent} from './wrapper/pivot-perspective-wrapper.component';

@NgModule({
  declarations: [
    PivotPerspectiveComponent,
    PivotPerspectiveWrapperComponent,
    PivotConfigComponent,
    PivotCleanAttributePipe,
    PivotValueAttributeConfigComponent,
    PivotHeaderAttributeConfigComponent,
    PivotAttributeSortComponent,
    PivotSortSelectItemsPipe,
    PivotSortSelectedIdPipe,
    PivotSubSortSelectItemsPipe,
    PivotSubSortValuesPipe,
    PivotValueTypeSelectItemsPipe,
    PivotAttributeSelectItemPipe,
    PivotHeaderRestrictedAttributesPipe,
    PivotHeaderMapAttributePipe,
    PivotConfigWrapperComponent,
    PivotTableCellHasValuePipe,
    PivotCellConfigurationPipe,
    PivotDataEmptyPipe,
    PivotCellClickablePipe,
    PivotHeaderCanSetStickyPipe,
  ],
  imports: [
    SharedModule,
    RouterModule,
    PivotPerspectiveRoutingModule,
    DragDropModule,
    DataInputModule,
    LmrPivotTableModule,
  ],
  exports: [PivotPerspectiveComponent],
})
export class PivotPerspectiveModule {}
