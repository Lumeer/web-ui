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

import {CalendarEvent} from 'angular-calendar';
import * as moment from 'moment';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarCollectionConfig,
  CalendarConfig,
} from '../../../../core/store/calendars/calendar.model';
import {Collection} from '../../../../core/store/collections/collection';
import {isCollectionAttributeEditable} from '../../../../core/store/collections/collection.util';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {Query} from '../../../../core/store/navigation/query';
import {deepObjectsEquals, isDateValid} from '../../../../shared/utils/common.utils';
import {formatData} from '../../../../shared/utils/data.utils';
import {shadeColor} from '../../../../shared/utils/html-modifier';

export interface CalendarMetaData {
  documentId: string;
  collectionId: string;
  color: string;
  startAttributeId: string;
  endAttributeId: string;
}

export function createCalendarEvents(
  config: CalendarConfig,
  collections: Collection[],
  documents: DocumentModel[],
  permissions: Record<string, AllowedPermissions>,
  constraintData: ConstraintData,
  query?: Query
): CalendarEvent<CalendarMetaData>[] {
  return collections.reduce((tasks, collection) => {
    tasks.push(
      ...createCalendarEventsForCollection(
        config,
        collection,
        documentsByCollection(documents, collection),
        permissions[collection.id] || {},
        constraintData
      )
    );
    return tasks;
  }, []);
}

function documentsByCollection(documents: DocumentModel[], collection: Collection): DocumentModel[] {
  return documents && documents.filter(document => document.collectionId === collection.id);
}

export function createCalendarEventsForCollection(
  config: CalendarConfig,
  collection: Collection,
  documents: DocumentModel[],
  permissions: AllowedPermissions,
  constraintData: ConstraintData,
  query?: Query
): CalendarEvent<CalendarMetaData>[] {
  const collectionConfig = config.collections && config.collections[collection.id];

  if (!collectionConfig) {
    return [];
  }

  const properties = collectionConfig.barsProperties || {};

  const nameProperty = properties[CalendarBarPropertyRequired.Name];
  const startProperty = properties[CalendarBarPropertyRequired.StartDate];

  const endProperty = properties[CalendarBarPropertyOptional.EndDate];
  const draggableStart =
    permissions.writeWithView &&
    isCollectionAttributeEditable(startProperty && startProperty.attributeId, collection, permissions, query);
  const draggableEnd =
    permissions.writeWithView &&
    isCollectionAttributeEditable(endProperty && endProperty.attributeId, collection, permissions, query);
  const allDayColor = getColor(true, collection.color);
  const color = getColor(false, collection.color);

  const events = [];

  for (const document of documents) {
    const formattedData = formatData(document.data, collection.attributes, constraintData);

    const title = nameProperty && formattedData[nameProperty.attributeId];
    const startString = startProperty && formattedData[startProperty.attributeId];

    const start = parseCalendarEventDate(startString);

    if (!isDateValid(start)) {
      continue;
    }

    const endString = endProperty && formattedData[endProperty.attributeId];
    const end = parseCalendarEventDate(endString);

    const allDay = isAllDayEvent(start, end);
    const interval = createInterval(start, startProperty.attributeId, end, end && endProperty.attributeId);
    const event = {
      title,
      start: interval[0].value,
      end: interval[1].value,
      color: allDay ? allDayColor : color,
      allDay,
      draggable: draggableStart || draggableEnd,
      resizable: {
        beforeStart: draggableStart && interval[1].value, // an end date is always required for resizable events to work
        afterEnd: draggableEnd && interval[1].value,
      },
      meta: {
        documentId: document.id,
        collectionId: document.collectionId,
        color: collection.color,
        startAttributeId: interval[0].attrId,
        endAttributeId: interval[1].attrId,
      },
    };

    events.push(event);
  }

  return events;
}

function createInterval(
  start: Date,
  startAttributeId,
  end: Date,
  endAttributeId: string
): [{value: Date; attrId: string}, {value?: Date; attrId?: string}] {
  if (end && moment(end).isBefore(moment(start))) {
    return [{value: end, attrId: endAttributeId}, {value: start, attrId: startAttributeId}];
  }
  return [{value: start, attrId: startAttributeId}, {value: end, attrId: endAttributeId}];
}

export function isAllDayEvent(start: Date, end: Date): boolean {
  return (
    start && end && start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0
  );
}

function getColor(allDay: boolean, color: string) {
  if (!allDay) {
    return {
      primary: color,
      secondary: shadeColor(color, 0.9),
    };
  }
  return {
    primary: shadeColor(color, 0.8),
    secondary: shadeColor(color, 0.7),
  };
}

const dateFormats = [
  'D.M.YYYY',
  'DD.M.YYYY',
  'DD.MM.YYYY',
  'D/M/YYYY',
  'DD/M/YYYY',
  'DD/MM/YYYY',
  'D/M/YY',
  'DD/M/YY',
  'DD/MM/YY',
  'YYYY/MM/DD',
  'YYYY/M/DD',
  'YYYY/M/D',
  'YYYY-MM-DD',
  'YYYY-M-DD',
  'YYYY-M-D',
  'D MMM YYYY',
  'DD MMM YYYY',
  'D MMMM YYYY',
  'DD MMMM YYYY',
  'MMM D, YYYY',
  'MMM DD, YYYY',
];

const timeFormats = [
  'HH:mm',
  'H:mm',
  'H:m',
  'hh:mm A',
  'hh:mmA',
  'h:mm A',
  'h:mmA',
  'hh.mm A',
  'hh.mmA',
  'h.mm A',
  'h.mmA',
];

export function parseCalendarEventDate(value: any): Date {
  if (!value) {
    return value;
  }

  const dateAndTimeFormats = dateFormats.reduce((formats, format) => {
    formats.push(...timeFormats.map(tf => [format, tf].join(' ')));
    return formats;
  }, []);

  const allFormats = [moment.ISO_8601, ...dateFormats, ...dateAndTimeFormats];
  const momentDate = moment(value, allFormats);
  return momentDate.isValid() ? momentDate.toDate() : null;
}

export function isCalendarConfigChanged(viewConfig: CalendarConfig, currentConfig: CalendarConfig): boolean {
  if (viewConfig.mode !== currentConfig.mode || datesChanged(viewConfig.date, currentConfig.date)) {
    return true;
  }

  return calendarConfigCollectionsChanged(viewConfig.collections || {}, currentConfig.collections || {});
}

function datesChanged(date1: Date, date2: Date): boolean {
  const isDate1Valid = isDateValid(date1);
  const isDate2Valid = isDateValid(date2);
  if (!isDate1Valid && !isDate2Valid) {
    return false;
  }
  if (isDate1Valid !== isDate2Valid) {
    return true;
  }

  return date1.getTime() !== date2.getTime();
}

function calendarConfigCollectionsChanged(
  collections1: Record<string, CalendarCollectionConfig>,
  collections2: Record<string, CalendarCollectionConfig>
): boolean {
  if (Object.keys(collections1).length !== Object.keys(collections2).length) {
    return true;
  }

  return Object.entries(collections1).some(([key, value]) => {
    return !collections2[key] || calendarConfigCollectionChanged(value, collections2[key]);
  });
}

function calendarConfigCollectionChanged(
  config1: CalendarCollectionConfig,
  config2: CalendarCollectionConfig
): boolean {
  if (Object.keys(config1.barsProperties).length !== Object.keys(config2.barsProperties).length) {
    return true;
  }

  return Object.entries(config1.barsProperties).some(([key, value]) => {
    return !config2.barsProperties[key] || !deepObjectsEquals(value, config2.barsProperties[key]);
  });
}
