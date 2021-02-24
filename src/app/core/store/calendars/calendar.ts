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

import {QueryStem} from '../navigation/query/query';
import {QueryAttribute} from '../../model/query-attribute';

export interface Calendar {
  id: string;
  config?: CalendarConfig;
}

export interface CalendarConfig {
  date: Date;
  mode: CalendarMode;
  list?: boolean;
  stemsConfigs: CalendarStemConfig[];
  positionSaved?: boolean;
  slotDuration?: SlotDuration;
  version?: CalendarConfigVersion;
}

export enum CalendarConfigVersion {
  V2 = '2',
  V1 = '1',
}

export enum CalendarMode {
  Month = 'month',
  Week = 'week',
  Day = 'day',
}

export enum CalendarGridMode {
  Week = 'resourceTimeGridWeek',
  Day = 'resourceTimeGridDay',
}

export interface CalendarStemConfig {
  stem?: QueryStem;
  name?: CalendarBar;
  start?: CalendarBar;
  end?: CalendarBar;
  color?: CalendarBar;
  group?: CalendarBar;
}

export enum SlotDuration {
  Hour = 'Hour',
  Half = 'Half',
  Quarter = 'Quarter',
  Ten = 'Ten',
  Five = 'Five',
}

export const slotDurationsMap: Record<SlotDuration, string> = {
  [SlotDuration.Hour]: '1:00:00',
  [SlotDuration.Half]: '0:30:00',
  [SlotDuration.Quarter]: '0:15:00',
  [SlotDuration.Ten]: '0:10:00',
  [SlotDuration.Five]: '0:05:00',
};

export interface CalendarBar extends QueryAttribute {}
