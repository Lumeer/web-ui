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

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {PipesModule} from '../pipes/pipes.module';
import {EmptySearchComponent} from './empty-search/empty-search.component';
import {EmptyStateComponent} from './empty-state/empty-state.component';
import {InvalidQueryComponent} from './invalid-query/invalid-query.component';
import {EmptyDataComponent} from './empty-data/empty-data.component';
import {SelectModule} from '../select/select.module';
import {PublicProjectMessageComponent} from './public-project-message/public-project-message.component';
import {ButtonModule} from '../button/button.module';

@NgModule({
  imports: [CommonModule, FormsModule, PipesModule, SelectModule, ButtonModule],
  declarations: [
    EmptySearchComponent,
    EmptyStateComponent,
    InvalidQueryComponent,
    EmptyDataComponent,
    PublicProjectMessageComponent,
  ],
  exports: [
    EmptySearchComponent,
    EmptyStateComponent,
    InvalidQueryComponent,
    EmptyDataComponent,
    PublicProjectMessageComponent,
  ],
})
export class WarningMessageModule {}
