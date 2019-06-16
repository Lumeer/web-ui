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
import {PivotDataHeader} from '../util/pivot-data';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {PivotRowColumnAttribute} from '../../../../core/store/pivots/pivot';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';

@Pipe({
  name: 'pivotSubSortSelectItems',
})
export class PivotSubSortSelectItemsPipe implements PipeTransform {
  public transform(
    pivotAttribute: PivotRowColumnAttribute,
    otherSideHeaders: PivotDataHeader[],
    index: number,
    summaryTitle: string
  ): SelectItemModel[] {
    if (!otherSideHeaders) {
      return [];
    }

    let currentOtherSideHeaders = otherSideHeaders;

    const values = pivotAttribute.sort.list.values || [];
    for (let i = 0; i < index; i++) {
      const value = values[i];
      const pivotHeader = value && (otherSideHeaders || []).find(header => header.title === value.title);
      if (!pivotHeader) {
        break;
      }

      currentOtherSideHeaders = pivotHeader.children || [];
    }

    const items: SelectItemModel[] = [];
    if (!this.isLastHeader(currentOtherSideHeaders)) {
      items.push({id: {title: summaryTitle, isSummary: true}, value: summaryTitle});
    }

    return [
      ...items,
      ...(currentOtherSideHeaders || []).map(header => ({id: {title: header.title}, value: header.title})),
    ];
  }

  private isLastHeader(otherSideHeaders: PivotDataHeader[]): boolean {
    if (otherSideHeaders && otherSideHeaders[0] && otherSideHeaders[0].children) {
      return otherSideHeaders[0].children[0] && isNotNullOrUndefined(otherSideHeaders[0].children[0].targetIndex);
    }
    return false;
  }
}
