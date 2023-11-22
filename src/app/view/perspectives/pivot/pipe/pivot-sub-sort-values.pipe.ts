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

import {PivotRowColumnAttribute, PivotSortValue} from '../../../../core/store/pivots/pivot';
import {PivotDataHeader} from '../util/pivot-data';

@Pipe({
  name: 'pivotSubSortValues',
})
export class PivotSubSortValuesPipe implements PipeTransform {
  public transform(pivotAttribute: PivotRowColumnAttribute, otherSideHeaders: PivotDataHeader[]): PivotSortValue[] {
    if (!otherSideHeaders) {
      return [];
    }

    let index = -1;
    let currentOtherSideHeaders = otherSideHeaders;

    const values = pivotAttribute.sort.list.values || [];
    while (true) {
      const currentIndex = index + 1;
      const value = values[currentIndex];
      if (value && value.isSummary) {
        return values.slice(0, currentIndex + (this.isLastHeader(otherSideHeaders) ? 0 : 1));
      }

      const pivotHeader = value && (currentOtherSideHeaders || []).find(header => header.title === value.title);
      if (!pivotHeader) {
        break;
      }

      currentOtherSideHeaders = pivotHeader.children || [];
      index++;
    }

    const items = index >= 0 ? values.slice(0, index + 1) : [];
    if (this.isLastHeader(currentOtherSideHeaders)) {
      return items;
    }
    return [...items, null];
  }

  private isLastHeader(otherSideHeaders: PivotDataHeader[]): boolean {
    return otherSideHeaders.length === 0 || otherSideHeaders[0].isValueHeader;
  }
}
