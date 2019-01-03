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
import {CommonModule} from '@angular/common';
import {ResourceStatusLineComponent} from './resource-detail/resource-status-line/resource-status-line.component';
import {ResourceDetailComponent} from './resource-detail/resource-detail.component';
import {ResourceMenuComponent} from './resource-menu.component';
import {ResourceListComponent} from './resource-list/resource-list.component';
import {PipesModule} from '../../../pipes/pipes.module';
import {CanCreateResourcePipe} from './pipes/can-create-resource.pipe';

@NgModule({
  imports: [CommonModule, PipesModule],
  declarations: [
    ResourceMenuComponent,
    ResourceDetailComponent,
    ResourceListComponent,
    ResourceStatusLineComponent,
    CanCreateResourcePipe,
  ],
  exports: [ResourceMenuComponent],
})
export class ResourceMenuModule {}
