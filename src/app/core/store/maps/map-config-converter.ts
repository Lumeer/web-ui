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

import {objectValues} from '../../../shared/utils/common.utils';
import {MapAttributeModel, MapConfig, MapConfigVersion, MapStemConfig} from './map.model';
import {MapConfigV0} from './map.model-old';
import {AttributesResourceType} from '../../model/resource';
import {isNotNullOrUndefined} from '@lumeer/utils';

export function convertMapDtoConfigToModel(config: any): MapConfig {
  if (!config) {
    return config;
  }

  return convertGanttChartDtoConfigToModelWithVersion(config);
}

function convertGanttChartDtoConfigToModelWithVersion(config: any): MapConfig {
  let version = parseVersion(config);
  let convertedConfig = config;

  while (version !== MapConfigVersion.V1) {
    switch (version) {
      default:
        convertedConfig = convertMapDtoToModelV0(convertedConfig);
        break;
    }

    version = parseVersion(convertedConfig);
  }
  return convertedConfig;
}

function parseVersion(config: any): string {
  return isNotNullOrUndefined(config?.version) ? String(config.version) : '';
}

function convertMapDtoToModelV0(config: MapConfigV0): MapConfig {
  const stemConfigsMap: Record<string, MapStemConfig> = {};
  for (const [collectionId, attributeIds] of Object.entries<string[]>(config.attributeIdsMap || {})) {
    const attributes: MapAttributeModel[] = [];

    for (const attributeId of attributeIds) {
      attributes.push({
        resourceId: collectionId,
        attributeId: attributeId,
        resourceIndex: 0,
        resourceType: AttributesResourceType.Collection,
      });
    }

    stemConfigsMap[collectionId] = {attributes, stem: {collectionId}};
  }

  return {...config, stemsConfigs: objectValues(stemConfigsMap), version: MapConfigVersion.V1};
}
