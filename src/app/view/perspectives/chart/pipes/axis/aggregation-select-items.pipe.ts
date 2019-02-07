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
import {ChartAggregation} from '../../../../../core/store/charts/chart';
import {SelectItemModel} from '../../../../../shared/select/select-item/select-item.model';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Pipe({
  name: 'aggregationSelectItems',
})
export class AggregationSelectItemsPipe implements PipeTransform {
  public constructor(private i18n: I18n) {}

  public transform(aggregations: ChartAggregation[]): SelectItemModel[] {
    return aggregations.map(aggregation => ({id: aggregation, value: this.chartAggregationName(aggregation)}));
  }

  private chartAggregationName(type: ChartAggregation): string {
    return this.i18n(
      {
        id: 'perspective.chart.config.aggregation.name',
        value: '{type, select, sum {Sum} avg {Average} min {Minimum} max {Maximum}}',
      },
      {type}
    );
  }
}
