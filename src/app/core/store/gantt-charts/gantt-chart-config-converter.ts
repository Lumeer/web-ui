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
import {
  GANTT_COLUMN_WIDTH,
  GANTT_PADDING,
  GanttChartBarModel,
  GanttChartConfig,
  ganttChartConfigLatestVersion,
  GanttChartConfigVersion,
  GanttChartStemConfig,
} from './gantt-chart';
import {isNotNullOrUndefined, objectValues} from '../../../shared/utils/common.utils';
import {
  GanttChartCollectionConfigV0,
  GanttChartConfigV0,
  GanttChartConfigV1,
  GanttChartConfigV2,
  GanttChartStemConfigV1,
} from './gantt-chart-old';
import {DataAggregationType} from '../../../shared/utils/data/data-aggregation';

export function convertGanttChartDtoConfigToModel(config: any): GanttChartConfig {
  if (!config) {
    return config;
  }

  const convertedConfig = convertGanttChartDtoConfigToModelWithVersion(config);
  return addDefaults(convertedConfig);
}

function convertGanttChartDtoConfigToModelWithVersion(config: any): GanttChartConfig {
  let version = parseVersion(config);
  let convertedConfig = config;

  while (version !== ganttChartConfigLatestVersion) {
    switch (version) {
      case GanttChartConfigVersion.V2:
        convertedConfig = convertGanttChartDtoToModelV2(convertedConfig);
        break;
      case GanttChartConfigVersion.V1:
        convertedConfig = convertGanttChartDtoToModelV1(convertedConfig);
        break;
      default:
        convertedConfig = convertGanttChartDtoToModelV0(convertedConfig);
        break;
    }

    version = parseVersion(convertedConfig);
  }
  return convertedConfig;
}

function parseVersion(config: any): string {
  return isNotNullOrUndefined(config?.version) ? String(config.version) : '';
}

function addDefaults(config: GanttChartConfig): GanttChartConfig {
  const stemsConfigs = (config.stemsConfigs || []).map(stemConfig => ({
    ...stemConfig,
    progress: stemConfig.progress
      ? {
          ...stemConfig.progress,
          aggregation: stemConfig.progress.aggregation || DataAggregationType.Avg,
        }
      : stemConfig.progress,
  }));
  return {...config, stemsConfigs};
}

function convertGanttChartDtoToModelV2(config: GanttChartConfigV2): GanttChartConfig {
  if (config.showDates) {
    const stemsConfigs = (config.stemsConfigs || []).map(stemConfig => {
      return {...stemConfig, attributes: [stemConfig.start, stemConfig.end].filter(model => !!model)};
    });
    return {...config, stemsConfigs, version: GanttChartConfigVersion.V3};
  }
  return {...config, version: GanttChartConfigVersion.V3};
}

function convertGanttChartDtoToModelV1(config: GanttChartConfigV1): GanttChartConfigV2 {
  const stemsConfigs: GanttChartStemConfig[] = (config.stemsConfigs || []).map(stemConfig => {
    const newConfig: GanttChartStemConfig = {stem: null};
    Object.entries(stemConfig.barsProperties || {}).forEach(([key, bar]) => {
      if (key !== 'category' && key !== 'subCategory') {
        newConfig[key] = bar;
      }
    });

    const category = stemConfig.barsProperties['category'];
    const subCategory = stemConfig.barsProperties['subCategory'];

    newConfig.categories = [category, subCategory].filter(cat => !!cat);
    newConfig.stem = stemConfig.stem;
    return newConfig;
  });

  return {
    ...config,
    stemsConfigs,
    lockResize: true,
    version: GanttChartConfigVersion.V2,
    columnWidth: GANTT_COLUMN_WIDTH,
    padding: GANTT_PADDING,
  };
}

function convertGanttChartDtoToModelV0(config: GanttChartConfigV0): GanttChartConfigV1 {
  const stemConfigsMap: Record<string, GanttChartStemConfigV1> = {};
  for (const [collectionId, collectionConfig] of Object.entries<GanttChartCollectionConfigV0>(
    config.collections || {}
  )) {
    const barsProperties: Record<string, GanttChartBarModel> = {};

    for (const [key, model] of Object.entries(collectionConfig.barsProperties || {})) {
      barsProperties[key] = {
        resourceId: model.resourceId || (model as any).collectionId,
        attributeId: model.attributeId,
        resourceIndex: model.resourceIndex || 0,
        resourceType: model.resourceType || AttributesResourceType.Collection,
      };
    }
    stemConfigsMap[collectionId] = {barsProperties, stem: {collectionId}};
  }

  return {mode: config.mode, stemsConfigs: objectValues(stemConfigsMap), version: GanttChartConfigVersion.V1};
}
