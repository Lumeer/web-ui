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
import {getViewColor, getViewIcon} from '../../core/store/views/view.utils';
import {Collection} from '../../core/store/collections/collection';
import {objectsByIdMap} from '../utils/common.utils';

@Pipe({
  name: 'viewsSelectItems',
})
export class ViewsSelectItemsPipe implements PipeTransform {
  public transform(views: View[], collections: Collection[]): SelectItemModel[] {
    return views?.map(view => this.viewSelectItem(view, objectsByIdMap(collections))) || [];
  }

  private viewSelectItem(view: View, collectionsMap: Record<string, Collection>): SelectItemModel {
    return {
      id: view.code,
      value: view.name,
      icons: [getViewIcon(view)],
      iconColors: [getViewColor(view, collectionsMap)],
    };
  }
}
