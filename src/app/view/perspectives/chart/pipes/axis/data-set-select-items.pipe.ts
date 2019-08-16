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
import {createSelectItemsForAxisType} from './pipes.util';

@Pipe({
  name: 'dataSetSelectItems',
})
export class DataSetSelectItemsPipe implements PipeTransform {
  public transform(
    axisType: ChartAxisType.Y1 | ChartAxisType.Y2,
    config: ChartConfig,
    collections: Collection[],
    linkTypes: LinkType[],
    query: Query
  ): SelectItemModel[] {
    return createSelectItemsForAxisType(axisType, config, collections, linkTypes, query, true);
  }
}
