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
import {LinksListComponent} from './links-list/links-list.component';
import {LinksListTabsComponent} from './links-list/links-list-tabs/links-list-tabs.component';
import {LinksListTableComponent} from './links-list/links-list-table/links-list-table.component';
import {PickerModule} from '../picker/picker.module';
import {InputModule} from '../input/input.module';
import {PipesModule} from '../pipes/pipes.module';
import {LinksListTableHeaderComponent} from './links-list/links-list-table/links-list-table-header/links-list-table-header.component';
import {LinksListTableBodyComponent} from './links-list/links-list-table/links-list-table-body/links-list-table-body.component';
import {DocumentHintsModule} from '../document-hints/document-hints.module';
import {LinkRowsDocumentIdsPipe} from './links-list/links-list-table/link-rows-document-ids.pipe';
import {DataInputModule} from '../data-input/data-input.module';
import {PresenterModule} from '../presenter/presenter.module';
import {LinksList2Module} from './links-list2/links-list2.module';

@NgModule({
  imports: [
    CommonModule,
    DataInputModule,
    PickerModule,
    PresenterModule,
    InputModule,
    PipesModule,
    DocumentHintsModule,
    LinksList2Module,
  ],
  declarations: [
    LinksListComponent,
    LinksListTabsComponent,
    LinksListTableComponent,
    LinksListTableHeaderComponent,
    LinksListTableBodyComponent,
    LinkRowsDocumentIdsPipe,
  ],
  exports: [LinksListComponent, LinksList2Module],
})
export class LinksModule {}
