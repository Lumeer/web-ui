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
import {SelectionListsComponent} from './selection-lists.component';
import { SelectionListComponent } from './content/list/selection-list.component';
import { SelectionListsContentComponent } from './content/selection-lists-content.component';
import { SelectionListModalComponent } from './content/modal/selection-list-modal.component';

@NgModule({
  declarations: [
    SelectionListsComponent,
    SelectionListComponent,
    SelectionListsContentComponent,
    SelectionListModalComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SelectionListsComponent
  ]
})
export class SelectionListsModule {
}
