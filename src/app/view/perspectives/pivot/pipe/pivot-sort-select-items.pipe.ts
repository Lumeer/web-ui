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
import {PivotStemData} from '../util/pivot-data';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {cleanQueryAttribute} from '../../../../core/model/query-attribute';

@Pipe({
  name: 'pivotSortSelectItems',
})
export class PivotSortSelectItemsPipe implements PipeTransform {
  public readonly summaryString: string;

  constructor() {
    this.summaryString = $localize`:@@perspective.pivot.table.summary.total:Summary`;
  }

  public transform(
    pivotAttribute: PivotRowColumnAttribute,
    attributeSelectItem: SelectItemModel,
    pivotData: PivotStemData
  ): SelectItemModel[] {
    const items: SelectItemModel[] = [];
    const cleanedPivotAttribute = cleanQueryAttribute(pivotAttribute);
    if (attributeSelectItem) {
      items.push({...attributeSelectItem, id: cleanedPivotAttribute});
    }

    return [...items, ...((pivotData && pivotData.valueTitles) || []).map(title => ({id: title, value: title}))];
  }
}
