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
import {isNumeric} from '../../../../shared/utils/common.utils';
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
  const startTimeProperty = properties[CalendarBarPropertyOptional.START_TIME];
  const endTimeProperty = properties[CalendarBarPropertyOptional.END_TIME];
  const draggable = permissisions.writeWithView;

  const events = [];

  for (const document of this.documents) {
    const title = nameProperty && document.data[nameProperty.attributeId];
    const startString = startProperty && document.data[startProperty.attributeId];

    if (!isDateValid(startString)) {
      continue;
    }

    const endString = endProperty && document.data[endProperty.attributeId];
    const start = moment(startString).toDate();
    const end = endString && moment(endString).isValid() && moment(endString).toDate();

    const startTimeString = startTimeProperty && document.data[startTimeProperty.attributeId];
    const endTimeString = endTimeProperty && document.data[endTimeProperty.attributeId];

    const startTimeChunks = this.parseTime(startTimeString);
    const endTimeChunks = this.parseTime(endTimeString);

    startTimeChunks && start.setHours(startTimeChunks[0], startTimeChunks[1]);
    endTimeChunks && end && end.setHours(endTimeChunks[0], endTimeChunks[1]);

    const allDay = isAllDayEvent(start, end);
    const interval = createInterval(
      start,
      startProperty.attributeId,
      startTimeChunks && startTimeProperty.attributeId,
      end,
      end && endProperty.attributeId,
      end && endTimeChunks && endTimeProperty.attributeId
    );

    const event = {
      title,
      start: interval[0].value,
      end: interval[1].value,
      color: this.getColor(allDay, collection.color),
      allDay,
      draggable: draggable,
      resizable: {
        beforeStart: draggable && interval[1].value, // an end date is always required for resizable events to work
        afterEnd: draggable && interval[1].value,
      },
      meta: {
        documentId: document.id,
        collectionId: document.collectionId,
        startAttributeId: interval[0].attrId,
        startTimeAttributeId: interval[0].timeAttrId,
        endAttributeId: interval[1].attrId,
        endTimeAttributeId: interval[1].timeAttrId,
      },
    };

    events.push(event);
  }

  return events;
}

function createInterval(
  start: Date,
  startAttributeId,
  startTimeAtributeId,
  end: Date,
  endAttributeId: string,
  endTimeAttributeId
): [{value: Date; attrId: string; timeAttrId: string}, {value?: Date; attrId?: string; timeAttrId?: string}] {
  if (end && moment(end).isAfter(moment(start))) {
    return [
      {value: end, attrId: endAttributeId, timeAttrId: endTimeAttributeId},
      {value: start, attrId: startAttributeId, timeAttrId: startTimeAtributeId},
    ];
  }
  return [
    {value: start, attrId: startAttributeId, timeAttrId: startAttributeId},
    {value: end, attrId: endAttributeId, timeAttrId: endTimeAttributeId},
  ];
}

function isDateValid(date: string): boolean {
  return moment(date).isValid();
}

//expected input hh:mm or hh.mm
function parseTime(time: string): [number, number] {
  const chunks = (time || '').split(/[:.]/g, 2);
  if (chunks.length !== 2) {
    return null;
  }

  const timeChunks = [+chunks[0], +chunks[1]].filter(num => isNumeric(num));
  if (timeChunks.length !== 2) {
    return null;
  }

  return [timeChunks[0], timeChunks[1]];
}

function isAllDayEvent(start: Date, end: Date): boolean {
  return end && start.getTime() === end.getTime() && start.getHours() === 0 && start.getMinutes() === 0;
}

function getColor(allDay: boolean, color: string) {
  if (allDay) {
    return {
      primary: color,
      secondary: shadeColor(color, 90),
    };
  }
  return {
    primary: shadeColor(color, 70),
    secondary: shadeColor(color, 60),
  };
}
