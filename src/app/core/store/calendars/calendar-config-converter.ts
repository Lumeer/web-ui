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
import {CalendarBarModel, CalendarConfig, CalendarConfigVersion, CalendarStemConfig} from './calendar.model';

export function convertCalendarDtoConfigToModel(config: any): CalendarConfig {
  if (!config) {
    return config;
  }

  switch (config.version) {
    case CalendarConfigVersion.V1:
      return convertCalendarDtoToModelV1(config);
    default:
      return convertCalendarDtoToModelV0(config);
  }
}

function convertCalendarDtoToModelV1(config: any): CalendarConfig {
  return config;
}

function convertCalendarDtoToModelV0(config: any): CalendarConfig {
  if (!config.collections) {
    return config;
  }

  const collections: Record<string, CalendarStemConfig> = {};
  for (const [collectionId, collectionConfig] of Object.entries<CalendarStemConfig>(config.collections)) {
    const barsProperties: Record<string, CalendarBarModel> = {};

    for (const [key, model] of Object.entries(collectionConfig.barsProperties || {})) {
      barsProperties[key] = {
        resourceId: model.resourceId || (model as any).collectionId,
        attributeId: model.attributeId,
        resourceIndex: model.resourceIndex || 0,
        resourceType: model.resourceType || AttributesResourceType.Collection,
      };
    }
    collections[collectionId] = {barsProperties};
  }

  return {
    date: config.date,
    mode: config.mode,
    stemsConfigs: Object.values(collections),
    version: CalendarConfigVersion.V1,
  };
}
