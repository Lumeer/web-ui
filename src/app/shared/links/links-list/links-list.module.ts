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
import {MatMenuModule} from '@angular/material/menu';

import {AccordionModule} from 'ngx-bootstrap/accordion';
import {TooltipModule} from 'ngx-bootstrap/tooltip';

import {DataInputModule} from '../../data-input/data-input.module';
import {DirectivesModule} from '../../directives/directives.module';
import {DocumentHintsModule} from '../../document-hints/document-hints.module';
import {InputModule} from '../../input/input.module';
import {AttributeFunctionModalModule} from '../../modal/attribute/function/attribute-function-modal.module';
import {AttributeTypeModalModule} from '../../modal/attribute/type/attribute-type-modal.module';
import {PipesModule} from '../../pipes/pipes.module';
import {PresenterModule} from '../../presenter/presenter.module';
import {LinkTablesAccordeonComponent} from './link-tables-accordeon.component';
import {LinksAccordeonComponent} from './links-accordeon.component';
import {AsAttributeResourcePipe} from './pipes/as-attribute-resource.pipe';
import {CalculateHintsOffsetPipe} from './pipes/calculate-hints-offset.pipe';
import {ColumnHandleLeftPipe} from './pipes/column-handle-left.pipe';
import {DocumentHintsColumnsPipe} from './pipes/document-hints-columns.pipe';
import {LinksCountPipe} from './pipes/links-count.pipe';
import {SortLinkRowsPipe} from './pipes/sort-link-rows.pipe';
import {LinksListTableBodyComponent} from './table/body/links-list-table-body.component';
import {LinksListTableRowComponent} from './table/body/row/links-list-table-row.component';
import {LinksListTableHeaderComponent} from './table/header/links-list-table-header.component';
import {LinksListHeaderMenuComponent} from './table/header/menu/links-list-header-menu.component';
import {LinksListTableComponent} from './table/links-list-table.component';
import {LinksListTabsComponent} from './tabs/links-list-tabs.component';

@NgModule({
  declarations: [
    LinksListTabsComponent,
    LinksListTableComponent,
    LinksListTableHeaderComponent,
    ColumnHandleLeftPipe,
    LinksListTableBodyComponent,
    LinksListTableRowComponent,
    LinksListHeaderMenuComponent,
    DocumentHintsColumnsPipe,
    CalculateHintsOffsetPipe,
    LinksAccordeonComponent,
    AsAttributeResourcePipe,
    LinksCountPipe,
    SortLinkRowsPipe,
    LinkTablesAccordeonComponent,
  ],
  imports: [
    CommonModule,
    PresenterModule,
    PipesModule,
    DragDropModule,
    DataInputModule,
    InputModule,
    DirectivesModule,
    AttributeTypeModalModule,
    AttributeFunctionModalModule,
    DocumentHintsModule,
    AccordionModule,
    MatMenuModule,
    TooltipModule,
  ],
  exports: [LinksAccordeonComponent, LinkTablesAccordeonComponent],
})
export class LinksListModule {}
