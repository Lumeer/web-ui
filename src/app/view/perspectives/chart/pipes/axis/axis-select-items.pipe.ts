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
import {ChartAxisType, ChartConfig} from '../../../../../core/store/charts/chart';
import {Collection} from '../../../../../core/store/collections/collection';
import {SelectItemModel} from '../../../../../shared/select/select-item/select-item.model';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {Query} from '../../../../../core/store/navigation/query/query';
import {deepObjectsEquals} from '../../../../../shared/utils/common.utils';
import {createSelectItemsForAxisType} from './pipes.util';

@Pipe({
  name: 'axisSelectItems',
})
export class AxisSelectItemsPipe implements PipeTransform {
  public transform(
    axisType: ChartAxisType,
    config: ChartConfig,
    collections: Collection[],
    linkTypes: LinkType[],
    query: Query,
    isDataSet?: boolean
  ): SelectItemModel[] {
    let restrictedAxes = [];

    if (isDataSet) {
      restrictedAxes = [
        ...Object.entries(config.names || {})
          .filter(entry => entry[0] !== axisType)
          .map(entry => entry[1]),
        ...Object.values(config.axes || {}),
      ];
    } else {
      restrictedAxes = [
        ...Object.entries(config.axes || {})
          .filter(entry => entry[0] !== axisType)
          .map(entry => entry[1]),
        ...Object.values(config.names || {}),
      ];
    }

    return createSelectItemsForAxisType(axisType, config, collections, linkTypes, query).filter(
      item => !restrictedAxes.find(restrictedItem => deepObjectsEquals(item.id, restrictedItem))
    );
  }
}
