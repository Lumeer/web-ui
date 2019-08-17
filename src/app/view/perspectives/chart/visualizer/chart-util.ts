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

import {ChartAxis, ChartAxisType, ChartConfig, ChartSortType, ChartType} from '../../../../core/store/charts/chart';
import {Query} from '../../../../core/store/navigation/query/query';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {AttributesResource} from '../../../../core/model/resource';
import {getAttributesResourceType} from '../../../../shared/utils/resource.utils';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {queryStemAttributesResourcesOrder} from '../../../../core/store/navigation/query/query.util';

export function convertChartDateTickFormat(format: string): string {
  if (!format) {
    return '%Y.%m.%d';
  }

  let tickFormat = format.replace(/%/g, '%%');

  tickFormat = tickFormat.replace(/(YY+)/g, '%Y');
  tickFormat = tickFormat.replace(/(D+)/g, '%d');
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
  const axes = checkOrTransformChartAxisMap(config.axes, attributesResourcesOrder);
  const names = checkOrTransformChartAxisMap(config.names, attributesResourcesOrder);
  const sort = config.sort && {
    ...config.sort,
    axis: checkOrTransformChartAxis(config.sort.axis, attributesResourcesOrder),
  };

  return {...config, axes, names, sort};
}

function checkOrTransformChartAxisMap(
  axisMap: Record<string, ChartAxis>,
  attributesResourcesOrder: AttributesResource[]
): Record<string, ChartAxis> {
  if (!axisMap) {
    return axisMap;
  }

  return Object.entries(axisMap)
    .filter(([, axis]) => !!axis)
    .reduce((map, [type, axis]) => {
      const newAxis = checkOrTransformChartAxis(axis, attributesResourcesOrder);
      if (newAxis) {
        map[type] = axis;
      }

      return map;
    }, {});
}

function checkOrTransformChartAxis(axis: ChartAxis, attributesResourcesOrder: AttributesResource[]): ChartAxis {
  if (!axis) {
    return axis;
  }

  const attributesResource = attributesResourcesOrder[axis.resourceIndex];
  if (
    attributesResource &&
    attributesResource.id === axis.resourceId &&
    getAttributesResourceType(attributesResource) === axis.resourceType
  ) {
    const attribute = findAttribute(attributesResource.attributes, axis.attributeId);
    if (attribute) {
      return axis;
    }
  } else {
    const newAttributesResourceIndex = attributesResourcesOrder.findIndex(
      ar => ar.id === axis.resourceId && getAttributesResourceType(ar) === axis.resourceType
    );
    if (newAttributesResourceIndex >= 0) {
      const attribute = findAttribute(
        attributesResourcesOrder[newAttributesResourceIndex].attributes,
        axis.attributeId
      );
      if (attribute) {
        return {...axis, resourceIndex: newAttributesResourceIndex};
      }
    }
  }

  return null;
}

function createDefaultConfig(): ChartConfig {
  return {
    type: ChartType.Line,
    axes: {},
    aggregations: {[ChartAxisType.Y1]: DataAggregationType.Sum, [ChartAxisType.Y2]: DataAggregationType.Sum},
    sort: {type: ChartSortType.Ascending},
  };
}

export function chartConfigIsEmpty(config: ChartConfig): boolean {
  return (
    Object.values((config && config.axes) || {}).filter(value => !!value).length === 0 &&
    Object.values((config && config.names) || {}).filter(value => !!value).length === 0
  );
}
