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

import {ChartAxisConfig, ChartAxisType, ChartConfig, ChartSort, ChartType} from './chart';
import {deepObjectCopy, deepObjectsEquals} from '../../../shared/utils/common.utils';

export function createChartSaveConfig(config: ChartConfig): ChartConfig {
  const configCopy = deepObjectCopy(config);
  if (config.type === ChartType.Pie) {
    delete configCopy.axes?.y2;
  }
  if (config.type !== ChartType.Bubble) {
    delete configCopy.axes?.x?.size;
    delete configCopy.axes?.y1?.size;
    delete configCopy.axes?.y2?.size;
  }

  return configCopy;
}

export function isChartConfigChanged(viewConfig: ChartConfig, currentConfig: ChartConfig): boolean {
  if (
    viewConfig.type !== currentConfig.type ||
    viewConfig.prediction !== currentConfig.prediction ||
    viewConfig.rangeSlider !== currentConfig.rangeSlider ||
    viewConfig.lockAxes !== currentConfig.lockAxes
  ) {
    return true;
  }

  if (sortChanged(viewConfig.sort, currentConfig.sort)) {
    return true;
  }

  const viewCleanedConfig = createChartSaveConfig(viewConfig);
  const currentCleanedConfig = createChartSaveConfig(currentConfig);

  return chartAxesChanged(viewCleanedConfig.axes || {}, currentCleanedConfig.axes || {});
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

function chartAxesChanged(
  previousAxes: Partial<Record<ChartAxisType, ChartAxisConfig>>,
  currentAxes: Partial<Record<ChartAxisType, ChartAxisConfig>>
): boolean {
  return (
    chartAxisConfigChanged(previousAxes?.x, currentAxes?.x) ||
    chartAxisConfigChanged(previousAxes?.y1, currentAxes?.y1) ||
    chartAxisConfigChanged(previousAxes?.y2, currentAxes?.y2)
  );
}

function chartAxisConfigChanged(previousAxis: ChartAxisConfig, currentAxis: ChartAxisConfig): boolean {
  return !deepObjectsEquals(previousAxis || {}, currentAxis || {});
}

export function chartAxisChanged(
  previousConfig: ChartConfig,
  currentConfig: ChartConfig,
  type: ChartAxisType
): boolean {
  return !deepObjectsEquals(
    cleanAxisWithoutSettings(previousConfig.axes?.[type]),
    cleanAxisWithoutSettings(currentConfig.axes?.[type])
  );
}

export function chartSettingsChanged(previousConfig: ChartConfig, currentConfig: ChartConfig): boolean {
  const previousCleaned = cleanConfigWithSettings(previousConfig);
  const currentCleaned = cleanConfigWithSettings(currentConfig);

  const previousWithoutSettings = cleanConfigWithoutSettings(previousConfig);
  const currentWithoutSettings = cleanConfigWithoutSettings(currentConfig);

  return (
    deepObjectsEquals(previousWithoutSettings, currentWithoutSettings) &&
    !deepObjectsEquals(previousCleaned, currentCleaned)
  );
}

function cleanConfigWithoutSettings(chartConfig: ChartConfig): ChartConfig {
  return {
    ...chartConfig,
    axes: {
      [ChartAxisType.X]: cleanAxisWithoutSettings(chartConfig.axes?.x),
      [ChartAxisType.Y1]: cleanAxisWithoutSettings(chartConfig.axes?.x),
      [ChartAxisType.Y2]: cleanAxisWithoutSettings(chartConfig.axes?.x),
    },
    rangeSlider: null,
  };
}

function cleanAxisWithoutSettings(axis: ChartAxisConfig): ChartAxisConfig {
  if (!axis) {
    return axis;
  }
  return {...axis, settings: null};
}

function cleanConfigWithSettings(chartConfig: ChartConfig): ChartConfig {
  return {
    ...chartConfig,
    axes: {
      [ChartAxisType.X]: cleanAxisWithSettings(chartConfig.axes?.x),
      [ChartAxisType.Y1]: cleanAxisWithSettings(chartConfig.axes?.x),
      [ChartAxisType.Y2]: cleanAxisWithSettings(chartConfig.axes?.x),
    },
    rangeSlider: chartConfig.rangeSlider || false,
  };
}

function cleanAxisWithSettings(axis: ChartAxisConfig): ChartAxisConfig {
  if (!axis) {
    return axis;
  }
  return {...axis, settings: axis.settings || {}};
}
