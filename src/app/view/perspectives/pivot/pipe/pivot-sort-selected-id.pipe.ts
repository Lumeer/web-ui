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
import {PivotRowColumnAttribute} from '../../../../core/store/pivots/pivot';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {cleanPivotAttribute} from '../util/pivot-util';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {PivotData} from '../util/pivot-data';

@Pipe({
  name: 'pivotSortSelectedId',
})
export class PivotSortSelectedIdPipe implements PipeTransform {
  public transform(pivotAttribute: PivotRowColumnAttribute, items: SelectItemModel[], pivotData: PivotData): any {
    if (
      pivotAttribute.sort &&
      pivotAttribute.sort.list &&
      this.itemsContainsId(items, pivotAttribute.sort.list.valueTitle)
    ) {
      return pivotAttribute.sort.list.valueTitle;
    }
    return cleanPivotAttribute(pivotAttribute);
  }

  private itemsContainsId(items: SelectItemModel[], id: any): boolean {
    return (items || []).some(item => deepObjectsEquals(item.id, id));
  }
}
