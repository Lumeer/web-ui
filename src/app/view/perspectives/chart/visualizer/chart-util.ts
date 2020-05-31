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

import {
  ChartAxisConfig,
  ChartAxisType,
  ChartConfig,
  ChartConfigVersion,
  ChartSortType,
  ChartType,
} from '../../../../core/store/charts/chart';
import {Query} from '../../../../core/store/navigation/query/query';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {AttributesResource} from '../../../../core/model/resource';
import {
  checkOrTransformQueryAttribute,
  queryStemAttributesResourcesOrder,
} from '../../../../core/store/navigation/query/query.util';

export function convertChartDateTickFormat(format: string): string {
  if (!format) {
    return '%Y.%m.%d';
  }

  let tickFormat = format.replace(/%/g, '%%');

  tickFormat = tickFormat.replace(/(YY+)/g, '%Y');
  tickFormat = tickFormat.replace(/(D+)/g, '%d');
  tickFormat = tickFormat.replace(/(ddd)/g, '%a');
  tickFormat = tickFormat.replace(/(M+)|(m+)/g, (str, reg1, reg2) => (!!reg1 ? '%m' : !!reg2 ? '%M' : ''));
  tickFormat = tickFormat.replace(/(H+)/g, '%H');
  tickFormat = tickFormat.replace(/(SS+)/g, '%L');
  tickFormat = tickFormat.replace(/(s+)/g, '%S');

  return tickFormat;
}

export function checkOrTransformChartConfig(
  config: ChartConfig,
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): ChartConfig {
  if (!config) {
    return createDefaultConfig();
  }

  const attributesResourcesOrder = queryStemAttributesResourcesOrder(
    query && query.stems && query.stems[0],
    collections,
    linkTypes
  );
  const axis: Partial<Record<ChartAxisType, ChartAxisConfig>> = {
    [ChartAxisType.X]: checkOrTransformChartAxisConfig(config.axes?.x, attributesResourcesOrder),
    [ChartAxisType.Y1]: checkOrTransformChartAxisConfig(config.axes?.y1, attributesResourcesOrder),
    [ChartAxisType.Y2]: checkOrTransformChartAxisConfig(config.axes?.y2, attributesResourcesOrder),
  };
  const sort = config.sort && {
    ...config.sort,
    axis: checkOrTransformQueryAttribute(config.sort.axis, attributesResourcesOrder),
  };

  return {...config, axes: axis, sort};
}

function checkOrTransformChartAxisConfig(
  axisConfig: ChartAxisConfig,
  attributesResourcesOrder: AttributesResource[]
): ChartAxisConfig {
  if (!axisConfig) {
    return axisConfig;
  }

  return {
    ...axisConfig,
    axis: checkOrTransformQueryAttribute(axisConfig.axis, attributesResourcesOrder),
    name: checkOrTransformQueryAttribute(axisConfig.name, attributesResourcesOrder),
    color: checkOrTransformQueryAttribute(axisConfig.color, attributesResourcesOrder),
    size: checkOrTransformQueryAttribute(axisConfig.size, attributesResourcesOrder),
  };
}

function createDefaultConfig(): ChartConfig {
  return {
    type: ChartType.Line,
    axes: {
      [ChartAxisType.X]: {},
      [ChartAxisType.Y1]: {aggregation: DataAggregationType.Sum},
      [ChartAxisType.Y2]: {aggregation: DataAggregationType.Sum},
    },
    sort: {type: ChartSortType.Ascending},
    version: ChartConfigVersion.V1,
  };
}
