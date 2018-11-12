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
import {shadeColor} from '../../../../utils/html-modifier';
import {QueryItem} from '../model/query-item';
import {QueryItemType} from '../model/query-item-type';

const DEFAULT_BACKGROUND_COLOR = '#faeabb';
const LINK_BACKGROUND_COLOR = '#ffffff';

@Pipe({
  name: 'queryItemBackground',
})
export class QueryItemBackgroundPipe implements PipeTransform {
  public transform(queryItem: QueryItem, isValid?: boolean): string {
    if ([QueryItemType.Link, QueryItemType.View, QueryItemType.Deleted].includes(queryItem.type)) {
      return LINK_BACKGROUND_COLOR;
    }

    if (queryItem.colors && queryItem.colors.length === 1) {
      return shadeColor(queryItem.colors[0], 0.5);
    }

    return DEFAULT_BACKGROUND_COLOR;
  }
}
