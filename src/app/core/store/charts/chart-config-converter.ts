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

import {ChartAxisConfig, ChartAxisType, ChartConfig, ChartConfigVersion} from './chart';
import {ChartConfigV0} from './chart-old';
import {isNotNullOrUndefined} from '@lumeer/utils';

export function convertChartDtoConfigToModel(config: any): ChartConfig {
  if (!config) {
    return config;
  }

  return convertChartDtoConfigToModelWithVersion(config);
}

function convertChartDtoConfigToModelWithVersion(config: any): ChartConfig {
  let version = parseVersion(config);
  let convertedConfig = config;

  while (version !== ChartConfigVersion.V1) {
    switch (version) {
      default:
        convertedConfig = convertChartDtoToModelV0(convertedConfig);
        break;
    }

    version = parseVersion(convertedConfig);
  }

  return convertedConfig;
}

function parseVersion(config: any): string {
  return isNotNullOrUndefined(config?.version) ? String(config.version) : '';
}

function convertChartDtoToModelV0(config: ChartConfigV0): ChartConfig {
  const xAxis: ChartAxisConfig = {
    axis: config.axes?.x,
    aggregation: config.aggregations?.x,
    color: config.colors?.x,
    name: config.names?.x,
  };

  const yAxis: ChartAxisConfig = {
    axis: config.axes?.y1,
    aggregation: config.aggregations?.y1,
    color: config.colors?.y1,
    name: config.names?.y1,
  };

  const y2Axis: ChartAxisConfig = {
    axis: config.axes?.y2,
    aggregation: config.aggregations?.y2,
    color: config.colors?.y2,
    name: config.names?.y2,
  };

  return {
    type: config.type,
    axes: {[ChartAxisType.X]: xAxis, [ChartAxisType.Y1]: yAxis, [ChartAxisType.Y2]: y2Axis},
    prediction: config.prediction,
    sort: config.sort,
    version: ChartConfigVersion.V1,
  };
}
