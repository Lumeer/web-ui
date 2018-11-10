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

import {CommonModule} from '@angular/common';
import {NgModule} from '@angular/core';

import {IsDeletedItemPipe} from './is-deleted-item.pipe';
import {IsAttributeItemPipe} from './is-attribute-item.pipe';
import {IsCollectionItemPipe} from './is-collection-item.pipe';
import {QueryItemBackgroundPipe} from './query-item-background';
import {QueryItemBorderPipe} from './query-item-border';
import {ConditionFilterPipe} from './condition-filter.pipe';
import {TruncatePipe} from './truncate.pipe';
import {QueryItemTextPipe} from './query-item-text.pipe';

@NgModule({
  imports: [CommonModule],
  declarations: [
    IsAttributeItemPipe,
    IsCollectionItemPipe,
    IsDeletedItemPipe,
    QueryItemBackgroundPipe,
    QueryItemBorderPipe,
    ConditionFilterPipe,
    QueryItemTextPipe,
    TruncatePipe,
  ],
  exports: [
    IsAttributeItemPipe,
    IsCollectionItemPipe,
    IsDeletedItemPipe,
    QueryItemBackgroundPipe,
    QueryItemBorderPipe,
    ConditionFilterPipe,
    QueryItemTextPipe,
    TruncatePipe,
  ],
})
export class SearchBoxPipesModule {}
