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
import {DataAggregationType} from '@lumeer/data-filters';

import {parseSelectTranslation} from './translation.utils';

export function dataAggregationName(type: DataAggregationType): string {
  return parseSelectTranslation(
    $localize`:@@data.aggregation.type:{type, select, sum {Sum} avg {Average} min {Minimum} max {Maximum} count {Count} unique {Unique} median {Median} join {Join} }`,
    {type}
  );
}

export const dataAggregationIconMap = {
  [DataAggregationType.Sum]: 'far fa-sigma',
  [DataAggregationType.Min]: 'far fa-arrow-up-1-9',
  [DataAggregationType.Max]: 'far fa-arrow-down-1-9',
  [DataAggregationType.Median]: 'far fa-gauge',
  [DataAggregationType.Avg]: 'fad fa-bars',
  [DataAggregationType.Count]: 'fad fa-grid',
  [DataAggregationType.Unique]: 'far fa-shapes',
  [DataAggregationType.Join]: 'far fa-input-text',
};

export const defaultDataAggregationType = Object.values(DataAggregationType)[0];
