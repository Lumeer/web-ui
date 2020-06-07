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

import {Pipe, PipeTransform} from '@angular/core';
import {View} from '../../core/store/views/view';
import {SelectItemModel} from '../select/select-item/select-item.model';
import {QueryData} from '../top-panel/search-box/util/query-data';
import {perspectiveIconsMap} from '../../view/perspectives/perspective';
import {QueryItemsConverter} from '../top-panel/search-box/query-item/query-items.converter';
import {queryItemsColor} from '../../core/store/navigation/query/query.util';

@Pipe({
  name: 'viewsSelectItems',
})
export class ViewsSelectItemsPipe implements PipeTransform {
  public transform(views: View[], queryData: QueryData): SelectItemModel[] {
    const converter = new QueryItemsConverter(queryData);
    return views?.map(view => this.viewSelectItem(view, converter)) || [];
  }

  private viewSelectItem(view: View, converter: QueryItemsConverter): SelectItemModel {
    const icon = perspectiveIconsMap[view.perspective] || '';
    const queryItems = converter.fromQuery(view.query);
    const color = queryItemsColor(queryItems);
    return {id: view.id, value: view.name, icons: [icon], iconColors: [color]};
  }
}
