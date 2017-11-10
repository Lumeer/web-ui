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
import {SharedModule} from '../../../shared/shared.module';
import {RouterModule} from '@angular/router';
import {TablePerspectiveComponent} from './table-perspective.component';
import {TableBodyComponent} from './body/table-body.component';
import {TableHeaderComponent} from './header/table-header.component';
import {TableBodyCellComponent} from './body-cell/table-body-cell.component';
import {TableHeaderCellComponent} from './header-cell/table-header-cell.component';
import {ContextMenuModule} from 'ngx-contextmenu';
import {TableManagerService} from './util/table-manager.service';
import {DragAndDropModule} from '../../../shared/drag-and-drop/drag-and-drop.module';

@NgModule({
  imports: [
    RouterModule,
    SharedModule,
    ContextMenuModule,
    DragAndDropModule
  ],
  declarations: [
    TablePerspectiveComponent,
    TableBodyComponent,
    TableBodyCellComponent,
    TableHeaderComponent,
    TableHeaderCellComponent
  ],
  providers: [
    TableManagerService
  ],
  entryComponents: [
    TablePerspectiveComponent
  ],
  exports: [
    TablePerspectiveComponent
  ]
})
export class TablePerspectiveModule {

}
