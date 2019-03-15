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

import {ChartAxis, ChartAxisResourceType, ChartConfig, ChartSort} from './chart';
import {deepObjectsEquals, isNotNullOrUndefind} from '../../../shared/utils/common.utils';
import {uniqueValues} from '../../../shared/utils/array.utils';
import {LinkType} from '../link-types/link.type';

export function isChartConfigChanged(viewConfig: ChartConfig, currentConfig: ChartConfig): boolean {
  if (viewConfig.type !== currentConfig.type || viewConfig.prediction !== currentConfig.prediction) {
    return true;
  }

  if (sortChanged(viewConfig.sort, currentConfig.sort)) {
    return true;
  }

  return (
    mapsChanged(viewConfig.axes || {}, currentConfig.axes || {}) ||
    mapsChanged(viewConfig.names || {}, currentConfig.names || {}) ||
    mapsChanged(viewConfig.aggregations || {}, currentConfig.aggregations || {})
  );
}

function sortChanged(sort1: ChartSort, sort2: ChartSort): boolean {
  if (!sort1 && !sort2) {
    return false;
  }

  if ((!sort1 && sort2) || (sort1 && !sort2)) {
    return true;
  }

  return sort1.type !== sort2.type || !deepObjectsEquals(sort1.axis || {}, sort2.axis || {});
}

function mapsChanged(map1: Record<string, any>, map2: Record<string, any>): boolean {
  if (Object.keys(map1).length !== Object.keys(map2).length) {
    return true;
  }

  return Object.entries(map1).some(([key, value]) => {
    return !map2[key] || !deepObjectsEquals(value, map2[key]);
  });
}

export function chartConfigCollectionIds(config: ChartConfig, linkTypes: LinkType[]): string[] {
  const ids: string[] = [];

  config.sort && config.sort.axis && ids.push(...axisCollectionIds(config.sort.axis, linkTypes));
  Object.values(config.axes || {}).forEach(axis => ids.push(...axisCollectionIds(axis, linkTypes)));
  Object.values(config.names || {}).forEach(axis => ids.push(...axisCollectionIds(axis, linkTypes)));

  return uniqueValues<string>(ids.filter(id => isNotNullOrUndefind(id)));
}

function axisCollectionIds(axis: ChartAxis, linkTypes: LinkType[]): string[] {
  if (axis.axisResourceType === ChartAxisResourceType.Collection) {
    return [axis.resourceId];
  } else if (axis.axisResourceType === ChartAxisResourceType.LinkType) {
    const linkType = linkTypes && linkTypes.find(lt => lt.id === axis.resourceId);
    if (linkType) {
      return linkType.collectionIds;
    }
  }

  return [];
}
