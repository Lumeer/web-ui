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

import {CalendarBar, CalendarConfigVersion, CalendarMode} from './calendar';
import {QueryStem} from '../navigation/query/query';

export interface CalendarConfigV1 {
  date: Date;
  mode: CalendarMode;
  stemsConfigs: CalendarStemConfigV1[];
  version: CalendarConfigVersion;
}

export interface CalendarStemConfigV1 {
  stem?: QueryStem;
  barsProperties?: Record<string, CalendarBar>;
}

export interface CalendarConfigV0 {
  date: Date;
  mode: CalendarMode;
  collections: Record<string, CalendarCollectionConfigV0>;
}

export interface CalendarCollectionConfigV0 {
  barsProperties?: Record<string, CalendarBarModelV0>;
}

export interface CalendarBarModelV0 {
  collectionId: string;
  attributeId: string;
}
