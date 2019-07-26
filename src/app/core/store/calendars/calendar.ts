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
import {QueryStem} from '../navigation/query';

export const DEFAULT_CALENDAR_ID = 'default';
export const CALENDAR_DATE_FORMAT = 'YYYY-MM-DD HH:mm';

export interface Calendar {
  id: string;
  config?: CalendarConfig;
}

export interface CalendarConfig {
  date: Date;
  mode: CalendarMode;
  stemsConfigs: CalendarStemConfig[];
  version?: CalendarConfigVersion;
}

export enum CalendarConfigVersion {
  V1 = '1',
}

export enum CalendarMode {
  Month = 'month',
  Week = 'week',
  Day = 'day',
}

export interface CalendarStemConfig {
  stem?: QueryStem;
  barsProperties?: Record<string, CalendarBar>;
}

export interface CalendarBar {
  resourceId: string;
  attributeId: string;
  resourceIndex?: number;
  resourceType: AttributesResourceType;
}

export type CalendarBarProperty = CalendarBarPropertyRequired | CalendarBarPropertyOptional;

export enum CalendarBarPropertyRequired {
  Name = 'name',
  StartDate = 'start',
}

export enum CalendarBarPropertyOptional {
  EndDate = 'end',
}
