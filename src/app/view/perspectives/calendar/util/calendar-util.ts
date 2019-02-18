/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
  CalendarBarPropertyOptional,
  CalendarBarPropertyRequired,
  CalendarConfig,
} from '../../../../core/store/calendars/calendar.model';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {CalendarEvent} from 'angular-calendar';
import * as moment from 'moment';
import {shadeColor} from '../../../../shared/utils/html-modifier';

export function createCalendarEvents(
  config: CalendarConfig,
  collections: Collection[],
  documents: DocumentModel[],
  permissions: Record<string, AllowedPermissions>
): CalendarEvent[] {
  return collections.reduce(
    (tasks, collection) => [
      ...tasks,
      ...createCalendarEventsForCollection(
        config,
        collection,
        documentsByCollection(documents, collection),
        permissions[collection.id] || {}
      ),
    ],
    []
  );
}

function documentsByCollection(documents: DocumentModel[], collection: Collection): DocumentModel[] {
  return documents && documents.filter(document => document.collectionId === collection.id);
}

export function createCalendarEventsForCollection(
  config: CalendarConfig,
  collection: Collection,
  documents: DocumentModel[],
  permissisions: AllowedPermissions
): CalendarEvent[] {
  const collectionConfig = config.collections && config.collections[collection.id];

  if (!collectionConfig) {
    return [];
  }

  const properties = collectionConfig.barsProperties || {};

  const nameProperty = properties[CalendarBarPropertyRequired.NAME];
  const startProperty = properties[CalendarBarPropertyRequired.START_DATE];

  const endProperty = properties[CalendarBarPropertyOptional.END_DATE];
  const draggable = permissisions.writeWithView;
  const allDayColor = getColor(true, collection.color);
  const color = getColor(false, collection.color);

  const events = [];

  for (const document of documents) {
    const title = nameProperty && document.data[nameProperty.attributeId];
    const startString = startProperty && document.data[startProperty.attributeId];

    if (!isDateValid(startString)) {
      continue;
    }

    const endString = endProperty && document.data[endProperty.attributeId];
    const start = moment(startString).toDate();
    const end = endString && moment(endString).isValid() && moment(endString).toDate();

    const allDay = isAllDayEvent(start, end);
    const interval = createInterval(start, startProperty.attributeId, end, end && endProperty.attributeId);
    const event = {
      title,
      start: interval[0].value,
      end: interval[1].value,
      color: allDay ? allDayColor : color,
      allDay,
      draggable: draggable,
      resizable: {
        beforeStart: draggable && interval[1].value, // an end date is always required for resizable events to work
        afterEnd: draggable && interval[1].value,
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

function isDateValid(date: string): boolean {
  return date && moment(date).isValid();
}

function isAllDayEvent(start: Date, end: Date): boolean {
  return end && start.getHours() === 0 && start.getMinutes() === 0 && end.getHours() === 0 && end.getMinutes() === 0;
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
