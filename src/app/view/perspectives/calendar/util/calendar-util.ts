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

import {
  CalendarBar,
  CalendarConfig,
  CalendarConfigVersion,
  CalendarMode,
  CalendarStemConfig,
} from '../../../../core/store/calendars/calendar';
import {Collection} from '../../../../core/store/collections/collection';
import {Query, QueryStem} from '../../../../core/store/navigation/query/query';
import {deepObjectsEquals, isDateValid} from '../../../../shared/utils/common.utils';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {
  checkOrTransformQueryAttribute,
  collectionIdsChainForStem,
  findBestStemConfigIndex,
  queryStemAttributesResourcesOrder,
} from '../../../../core/store/navigation/query/query.util';
import {createDefaultNameAndDateRangeConfig} from '../../common/perspective-util';
import * as moment from 'moment';
import {queryAttributePermissions} from '../../../../core/model/query-attribute';
import {AllowedPermissionsMap} from '../../../../core/model/allowed-permissions';

export function isAllDayEvent(start: Date, end: Date): boolean {
  return isAllDayEventSingle(start) && isAllDayEventSingle(end);
}

export function isAllDayEventSingle(date: Date): boolean {
  return (
    isDateValid(date) &&
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getHours() === 0 &&
    date.getMinutes() === 0
  );
}

export function isCalendarConfigChanged(viewConfig: CalendarConfig, currentConfig: CalendarConfig): boolean {
  if (viewConfig.mode !== currentConfig.mode || viewConfig.list !== currentConfig.list) {
    return true;
  }

  if (Boolean(viewConfig.positionSaved) !== Boolean(currentConfig.positionSaved)) {
    return true;
  }

  if (calendarStemsConfigsChanged(viewConfig.stemsConfigs || [], currentConfig.stemsConfigs || [])) {
    return true;
  }

  if (viewConfig.positionSaved || currentConfig.positionSaved) {
    return datesChanged(viewConfig.mode, viewConfig.date, currentConfig.date);
  }

  return false;
}

function datesChanged(mode: CalendarMode, date1: Date, date2: Date): boolean {
  const isDate1Valid = isDateValid(date1);
  const isDate2Valid = isDateValid(date2);
  if (!isDate1Valid && !isDate2Valid) {
    return false;
  }
  if (isDate1Valid !== isDate2Valid) {
    return true;
  }

  const moment1 = moment(date1);
  const moment2 = moment(date2);

  switch (mode) {
    case CalendarMode.Month:
      return moment1.year() !== moment2.year() || moment1.month() !== moment2.month();
    case CalendarMode.Week:
      return moment1.year() !== moment2.year() || moment1.weekYear() !== moment2.weekYear();
    case CalendarMode.Day:
      return (
        moment1.year() !== moment2.year() || moment1.month() !== moment2.month() || moment1.date() !== moment2.date()
      );
  }

  return date1.getTime() !== date2.getTime();
}

function calendarStemsConfigsChanged(c1: CalendarStemConfig[], c2: CalendarStemConfig[]): boolean {
  if (c1.length !== c2.length) {
    return true;
  }

  return c1.some((config, index) => calendarStemConfigChanged(config, c2[index]));
}

function calendarStemConfigChanged(config1: CalendarStemConfig, config2: CalendarStemConfig): boolean {
  const config1DefinedProperties = calendarConfigDefinedProperties(config1);
  const config2DefinedProperties = calendarConfigDefinedProperties(config2);
  if (config1DefinedProperties.length !== config2DefinedProperties.length) {
    return true;
  }

  const config2Properties = calendarStemConfigProperties(config2);
  return calendarStemConfigProperties(config1).some((bar, index) => {
    return !deepObjectsEquals(bar, config2Properties[index]);
  });
}

function calendarStemConfigProperties(config: CalendarStemConfig): CalendarBar[] {
  return [config.start, config.end, config.name, config.color, config.group];
}

function calendarConfigDefinedProperties(config: CalendarStemConfig): CalendarBar[] {
  return calendarStemConfigProperties(config).filter(bar => !!bar);
}

export function checkOrTransformCalendarConfig(
  config: CalendarConfig,
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): CalendarConfig {
  if (!config) {
    return calendarDefaultConfig(query, collections, linkTypes);
  }

  return {
    ...config,
    stemsConfigs: checkOrTransformCalendarStemsConfig(config.stemsConfigs || [], query, collections, linkTypes),
  };
}

function checkOrTransformCalendarStemsConfig(
  stemsConfigs: CalendarStemConfig[],
  query: Query,
  collections: Collection[],
  linkTypes: LinkType[]
): CalendarStemConfig[] {
  const stemsConfigsCopy = [...(stemsConfigs || [])];
  return (query?.stems || []).map(stem => {
    const stemCollectionIds = collectionIdsChainForStem(stem, linkTypes);
    const stemConfigIndex = findBestStemConfigIndex(stemsConfigsCopy, stemCollectionIds, linkTypes);
    const stemConfig = stemsConfigsCopy.splice(stemConfigIndex, 1);
    return checkOrTransformCalendarStemConfig(stemConfig[0], stem, collections, linkTypes);
  });
}

function checkOrTransformCalendarStemConfig(
  stemConfig: CalendarStemConfig,
  stem: QueryStem,
  collections: Collection[],
  linkTypes: LinkType[]
): CalendarStemConfig {
  if (!stemConfig) {
    return getCalendarDefaultStemConfig(stem, collections, linkTypes);
  }

  const attributesResourcesOrder = queryStemAttributesResourcesOrder(stem, collections, linkTypes);
  return {
    stem,
    name: checkOrTransformQueryAttribute(stemConfig.name, attributesResourcesOrder),
    start: checkOrTransformQueryAttribute(stemConfig.start, attributesResourcesOrder),
    end: checkOrTransformQueryAttribute(stemConfig.end, attributesResourcesOrder),
    color: checkOrTransformQueryAttribute(stemConfig.color, attributesResourcesOrder),
    group: checkOrTransformQueryAttribute(stemConfig.group, attributesResourcesOrder),
  };
}

function calendarDefaultConfig(query: Query, collections: Collection[], linkTypes: LinkType[]): CalendarConfig {
  const stems = query?.stems || [];
  const stemsConfigs = stems.map(stem => getCalendarDefaultStemConfig(stem, collections, linkTypes));
  return {
    mode: CalendarMode.Month,
    list: false,
    date: moment().startOf('day').toDate(),
    version: CalendarConfigVersion.V2,
    stemsConfigs,
  };
}

export function getCalendarDefaultStemConfig(
  stem?: QueryStem,
  collections?: Collection[],
  linkTypes?: LinkType[]
): CalendarStemConfig {
  if (stem && collections && linkTypes) {
    const config = createDefaultNameAndDateRangeConfig(stem, collections, linkTypes);
    return {stem, ...config};
  }
  return {stem};
}

export function calendarStemConfigIsWritable(
  stemConfig: CalendarStemConfig,
  permissions: AllowedPermissionsMap,
  linkTypesMap: Record<string, LinkType>
): boolean {
  return (
    stemConfig?.start &&
    queryAttributePermissions(stemConfig.start, permissions, linkTypesMap)?.writeWithView &&
    (!stemConfig?.end || queryAttributePermissions(stemConfig.end, permissions, linkTypesMap)?.writeWithView)
  );
}

export function createCalendarSaveConfig(config: CalendarConfig): CalendarConfig {
  const copy = {...config};
  if (config.positionSaved) {
    copy.date = config.date || new Date();
  } else {
    delete copy.date;
  }
  return copy;
}
