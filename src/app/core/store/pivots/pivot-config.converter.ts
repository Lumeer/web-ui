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
import {LmrPivotConfig, LmrPivotConfigVersion} from '@lumeer/pivot';
import {isNotNullOrUndefined} from '@lumeer/utils';

import {PivotConfigV0} from './pivot-old';

export function convertPivotConfigDtoToModel(config: any): LmrPivotConfig {
  if (!config) {
    return config;
  }
  const version = isNotNullOrUndefined(config.version) ? String(config.version) : '';
  switch (version) {
    case LmrPivotConfigVersion.V1:
      return convertPivotConfigDtoToModelV1(config);
    default:
      return convertPivotConfigDtoToModelV0(config);
  }
}

function convertPivotConfigDtoToModelV1(config: LmrPivotConfig): LmrPivotConfig {
  return config;
}

function convertPivotConfigDtoToModelV0(config: PivotConfigV0): LmrPivotConfig {
  return {version: LmrPivotConfigVersion.V1, stemsConfigs: [config]};
}
