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
import {CalendarBar, CalendarConfig, CalendarConfigVersion, CalendarStemConfig} from './calendar';
import {CalendarCollectionConfigV0, CalendarConfigV0} from './calendar-old';
import {isDateValid, isNotNullOrUndefined} from '../../../shared/utils/common.utils';

export function convertCalendarDtoConfigToModel(config: any): CalendarConfig {
  if (!config) {
    return config;
  }

  const convertedConfig = convertCalendarConfigDtoToModelWithVersion(config);
  return convertConfigValues(convertedConfig);
}

function convertCalendarConfigDtoToModelWithVersion(config: any): CalendarConfig {
  const version = isNotNullOrUndefined(config.version) ? String(config.version) : '';
  switch (version) {
    case CalendarConfigVersion.V1:
      return convertCalendarDtoToModelV1(config);
    default:
      return convertCalendarDtoToModelV0(config);
  }
}

function convertConfigValues(config: CalendarConfig): CalendarConfig {
  if (config.date && !isDateValid(config.date)) {
    return {...config, date: new Date(config.date)};
  }
  return config;
}

function convertCalendarDtoToModelV1(config: CalendarConfig): CalendarConfig {
  return config;
}

function convertCalendarDtoToModelV0(config: CalendarConfigV0): CalendarConfig {
  const stemConfigsMap: Record<string, CalendarStemConfig> = {};
  for (const [collectionId, collectionConfig] of Object.entries<CalendarCollectionConfigV0>(config.collections || {})) {
    const barsProperties: Record<string, CalendarBar> = {};

    for (const [key, model] of Object.entries(collectionConfig.barsProperties || {})) {
      barsProperties[key] = {
        resourceId: model.collectionId,
        attributeId: model.attributeId,
        resourceIndex: 0,
        resourceType: AttributesResourceType.Collection,
      };
    }
    stemConfigsMap[collectionId] = {barsProperties, stem: {collectionId}};
  }

  return {
    date: config.date,
    mode: config.mode,
    stemsConfigs: Object.values(stemConfigsMap),
    version: CalendarConfigVersion.V1,
  };
}
