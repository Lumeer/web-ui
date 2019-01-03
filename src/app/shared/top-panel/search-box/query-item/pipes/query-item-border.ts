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

import {Pipe, PipeTransform} from '@angular/core';

import {QueryItem} from '../model/query-item';
import {QueryItemType} from '../model/query-item-type';
import {QueryItemBackgroundPipe} from './query-item-background';

const LINK_BORDER_COLOR = '#ced4da';
const DANGER_COLOR = '#dc3545';

@Pipe({
  name: 'queryItemBorder',
})
export class QueryItemBorderPipe extends QueryItemBackgroundPipe implements PipeTransform {
  public transform(queryItem: QueryItem, isValid: boolean): string {
    if (!isValid || queryItem.type === QueryItemType.Deleted) {
      return DANGER_COLOR;
    }
    if (queryItem.type === QueryItemType.Link || queryItem.type === QueryItemType.View) {
      return LINK_BORDER_COLOR;
    }
    return super.transform(queryItem, isValid);
  }
}
