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

import {AttributesResourceType} from '../../model/resource';
import {GanttChartBarModel, GanttChartConfig, GanttChartConfigVersion, GanttChartStemConfig} from './gantt-chart';
import {GanttChartConfigV0} from './gantt-chart-old';
import {isNotNullOrUndefined} from '../../../shared/utils/common.utils';

export function convertGanttChartDtoConfigToModel(config: any): GanttChartConfig {
  if (!config) {
    return config;
  }

  const version = isNotNullOrUndefined(config.version) ? String(config.version) : '';
  switch (version) {
    case GanttChartConfigVersion.V1:
      return convertGanttChartDtoToModelV1(config);
    default:
      return convertGanttChartDtoToModelV0(config);
  }
}

function convertGanttChartDtoToModelV1(config: GanttChartConfig): GanttChartConfig {
  return config;
}

function convertGanttChartDtoToModelV0(config: GanttChartConfigV0): GanttChartConfig {
  const collections: Record<string, GanttChartStemConfig> = {};
  for (const [collectionId, collectionConfig] of Object.entries<GanttChartStemConfig>(config.collections || {})) {
    const barsProperties: Record<string, GanttChartBarModel> = {};

    for (const [key, model] of Object.entries(collectionConfig.barsProperties || {})) {
      barsProperties[key] = {
        resourceId: model.resourceId || (model as any).collectionId,
        attributeId: model.attributeId,
        resourceIndex: model.resourceIndex || 0,
        resourceType: model.resourceType || AttributesResourceType.Collection,
      };
    }
    collections[collectionId] = {barsProperties, stem: {collectionId}};
  }

  return {mode: config.mode, stemsConfigs: Object.values(collections), version: GanttChartConfigVersion.V1};
}
