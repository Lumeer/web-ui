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

import {ScrollingModule} from '@angular/cdk/scrolling';
import {NgModule} from '@angular/core';
import {ClickOutsideModule} from 'ng-click-outside';
import {PipesModule} from '../../../shared/pipes/pipes.module';
import {SharedModule} from '../../../shared/shared.module';
import {TableBodyModule} from './body/table-body.module';
import {TableHeaderModule} from './header/table-header.module';
import {TablePipesModule} from './shared/pipes/table-pipes.module';
import {TableSharedModule} from './shared/table-shared.module';
import {TablePerspectiveComponent} from './table-perspective.component';

@NgModule({
  imports: [
    ClickOutsideModule,
    TableBodyModule,
    TableHeaderModule,
    TableSharedModule,
    SharedModule,
    PipesModule,
    TablePipesModule,
    ScrollingModule,
  ],
  declarations: [TablePerspectiveComponent],
  entryComponents: [TablePerspectiveComponent],
  exports: [TablePerspectiveComponent],
})
export class TablePerspectiveModule {}
