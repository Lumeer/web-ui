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

import {cleanQueryAttribute} from '@lumeer/data-filters';
import {LmrPivotRowColumnAttribute} from '@lumeer/pivot';
import {deepObjectsEquals} from '@lumeer/utils';

import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';

@Pipe({
  name: 'pivotSortSelectedId',
})
export class PivotSortSelectedIdPipe implements PipeTransform {
  public transform(pivotAttribute: LmrPivotRowColumnAttribute, items: SelectItemModel[]): any {
    if (
      pivotAttribute.sort &&
      pivotAttribute.sort.list &&
      this.itemsContainsId(items, pivotAttribute.sort.list.valueTitle)
    ) {
      return pivotAttribute.sort.list.valueTitle;
    }
    return cleanQueryAttribute(pivotAttribute);
  }

  private itemsContainsId(items: SelectItemModel[], id: any): boolean {
    return (items || []).some(item => deepObjectsEquals(item.id, id));
  }
}
