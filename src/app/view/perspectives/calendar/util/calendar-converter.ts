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
import * as moment from 'moment';

import {
  Constraint,
  ConstraintData,
  ConstraintType,
  DataObjectAggregator,
  DataObjectAttribute,
  DataObjectInfo,
  DocumentsAndLinksData,
  userCanEditDataResource,
} from '@lumeer/data-filters';
import {isArray, isDateValid, isNotNullOrUndefined, unescapeHtml} from '@lumeer/utils';

import {ResourcesPermissions} from '../../../../core/model/allowed-permissions';
import {CalendarConfig, CalendarMode, CalendarStemConfig} from '../../../../core/store/calendars/calendar';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query} from '../../../../core/store/navigation/query/query';
import {contrastColor} from '../../../../shared/utils/color.utils';
import {constraintContainsHoursInConfig, createDatesInterval} from '../../../../shared/utils/date.utils';
import {shadeColor} from '../../../../shared/utils/html-modifier';
import {CalendarEvent, CalendarMetaData} from './calendar-event';
import {isAllDayEvent} from './calendar-util';

enum DataObjectInfoKeyType {
  Name = 'name',
  Start = 'start',
  End = 'end',
  Color = 'color',
  Group = 'group',
}

export class CalendarConverter {
  private config: CalendarConfig;
  private constraintData?: ConstraintData;

  private dataObjectAggregator = new DataObjectAggregator<any>(value => value);

  public convert(
    config: CalendarConfig,
    collections: Collection[],
    linkTypes: LinkType[],
    data: DocumentsAndLinksData,
    permissions: ResourcesPermissions,
    constraintData: ConstraintData,
    query: Query
  ): CalendarEvent[] {
    this.config = config;
    this.constraintData = constraintData;

    const events = (query?.stems || []).reduce((allEvents, stem, index) => {
      const stemData = data.dataByStems?.[index];
      this.dataObjectAggregator.updateData(
        collections,
        stemData?.documents || [],
        linkTypes,
        stemData?.linkInstances || [],
        stem,
        permissions,
        constraintData
      );
      allEvents.push(...this.convertByStem(index));
      return allEvents;
    }, []);
    return filterUniqueEvents(events);
  }

  private convertByStem(index: number): CalendarEvent[] {
    const stemConfig = this.config?.stemsConfigs?.[index];
    if (this.requiredPropertiesAreSet(stemConfig)) {
      return this.convertByAggregation(stemConfig, index);
    }
    return [];
  }

  private requiredPropertiesAreSet(stemConfig: CalendarStemConfig): boolean {
    return !!stemConfig.start;
  }

  private convertByAggregation(stemConfig: CalendarStemConfig, stemIndex: number): CalendarEvent[] {
    const objectAttributes: DataObjectAttribute[] = [
      stemConfig.name && {...stemConfig.name, key: DataObjectInfoKeyType.Name},
      stemConfig.start && {...stemConfig.start, key: DataObjectInfoKeyType.Start},
      stemConfig.end && {...stemConfig.end, key: DataObjectInfoKeyType.End},
    ].filter(attribute => !!attribute);
    const metaAttributes: DataObjectAttribute[] = [
      stemConfig.color && {...stemConfig.color, key: DataObjectInfoKeyType.Color},
    ].filter(attribute => !!attribute);
    const groupingAttributes: DataObjectAttribute[] = [
      stemConfig.group && {...stemConfig.group, key: DataObjectInfoKeyType.Group},
    ].filter(attribute => !!attribute);

    const dataObjectsInfo = this.dataObjectAggregator.convert({
      groupingAttributes: this.config.mode !== CalendarMode.Month ? groupingAttributes : [],
      objectAttributes,
      metaAttributes,
      objectsConverter: value => value,
    });

    return this.createCalendarEventsForStem(stemConfig, dataObjectsInfo, stemIndex);
  }

  private createCalendarEventsForStem(
    stemConfig: CalendarStemConfig,
    dataObjectsInfo: DataObjectInfo<any>[],
    stemIndex: number
  ): CalendarEvent[] {
    const nameConstraint = this.dataObjectAggregator.findAttributeConstraint(stemConfig.name);

    const startConstraint = this.dataObjectAggregator.findAttributeConstraint(stemConfig.start);
    const startPermission = this.dataObjectAggregator.attributePermissions(stemConfig.start);
    const startResource = this.dataObjectAggregator.getResource(stemConfig.start);

    const endConstraint = this.dataObjectAggregator.findAttributeConstraint(stemConfig.end);
    const endPermission = this.dataObjectAggregator.attributePermissions(stemConfig.end);
    const endResource = this.dataObjectAggregator.getResource(stemConfig.end);

    const groupConstraint = this.dataObjectAggregator.findAttributeConstraint(stemConfig.group);

    const resourceColor = this.dataObjectAggregator.getAttributeResourceColor(stemConfig.name || stemConfig.start);

    return dataObjectsInfo.reduce<CalendarEvent[]>((events, item) => {
      let startDataResource = item.objectDataResources[DataObjectInfoKeyType.Start];
      const start = stemConfig.start && startDataResource?.data[stemConfig.start.attributeId];
      let endDataResource = item.objectDataResources[DataObjectInfoKeyType.End];
      const end = stemConfig.end && endDataResource?.data[stemConfig.end.attributeId];
      const interval = createInterval(start, startConstraint, end, endConstraint, this.constraintData);
      if (!isDateValid(interval.start)) {
        return events;
      }

      const nameDataResource = item.objectDataResources[DataObjectInfoKeyType.Name];
      const name = (stemConfig.name && nameDataResource?.data[stemConfig.name.attributeId]) || '';

      if (interval.swapped) {
        const startCopy = startDataResource;
        startDataResource = endDataResource;
        endDataResource = startCopy;
      }

      const metadata: CalendarMetaData = {
        startDataId: interval.swapped ? endDataResource?.id : startDataResource?.id,
        endDataId: interval.swapped ? startDataResource?.id : endDataResource?.id,
        nameDataId: nameDataResource?.id,
        stemConfig: interval.swapped ? {...stemConfig, start: stemConfig.end, end: stemConfig.start} : stemConfig,
        stemIndex,
        dataResourcesChain: item.dataResourcesChain,
      };

      const startAttributeEditable = this.dataObjectAggregator.isAttributeEditable(
        metadata.stemConfig.start,
        startDataResource
      );
      const endAttributeEditable = this.dataObjectAggregator.isAttributeEditable(
        metadata.stemConfig.end,
        endDataResource
      );

      const eventStartConstraint = interval.swapped ? endConstraint : startConstraint;
      const eventEndConstraint = interval.swapped ? startConstraint : endConstraint;

      const colorDataResources = item.metaDataResources[DataObjectInfoKeyType.Color] || [];
      const eventColor = this.dataObjectAggregator.getAttributeColor(stemConfig.color, colorDataResources);

      const allDay = isAllDayEvent(interval.start, interval.end);

      const titles = isArray(name) ? name : [name];
      for (let i = 0; i < titles.length; i++) {
        const titleFormatted = nameConstraint.createDataValue(titles[i], this.constraintData).title();

        let resourceIds;
        let formattedGroups;

        if (stemConfig.group) {
          resourceIds = item.groupingObjects;
          formattedGroups = resourceIds.map(value =>
            unescapeHtml(groupConstraint.createDataValue(value, this.constraintData).preview())
          );
        }

        metadata.formattedGroups = formattedGroups;

        let startEditable =
          interval.start &&
          metadata.stemConfig.start &&
          startAttributeEditable &&
          userCanEditDataResource(
            startDataResource,
            interval.swapped ? endDataResource : startDataResource,
            interval.swapped ? endPermission : startPermission,
            this.constraintData?.currentUser,
            this.constraintData
          );

        const endEditable =
          interval.end &&
          metadata.stemConfig.end &&
          endAttributeEditable &&
          userCanEditDataResource(
            endDataResource,
            interval.swapped ? startResource : endResource,
            interval.swapped ? startPermission : endPermission,
            this.constraintData?.currentUser,
            this.constraintData
          );

        let durationEditable;
        if (eventStartConstraint?.type === ConstraintType.Duration) {
          durationEditable = startEditable;
          startEditable = endEditable;
        } else if (eventEndConstraint?.type === ConstraintType.Duration) {
          durationEditable = endEditable;
        } else {
          durationEditable = endEditable;
        }

        const backgroundColor = eventColor || shadeColor(resourceColor, 0.5);
        const eventGroupId = groupId(item);
        const event: CalendarEvent = {
          id: eventUniqueId(metadata, eventGroupId, resourceIds),
          title: titleFormatted,
          start: interval.start,
          end: interval.end,
          backgroundColor,
          borderColor: eventColor || shadeColor(resourceColor, 0.4),
          textColor: contrastColor(backgroundColor),
          allDay,
          startEditable,
          durationEditable,
          extendedProps: metadata,
          resourceIds,
        };

        events.push(event);
      }

      return events;
    }, []);
  }
}

function eventUniqueId(metadata: CalendarMetaData, groupId: string, resourceIds: string[]): string {
  const stemConfig = metadata.stemConfig;
  const attributesId = `${stemConfig.name?.attributeId}:${stemConfig.start?.attributeId}:${stemConfig.end?.attributeId}`;
  const resourcesIds = (resourceIds || []).join(':');
  return `${groupId}:${attributesId}:${resourcesIds}`;
}

function filterUniqueEvents(events: CalendarEvent[]): CalendarEvent[] {
  const usedIds = new Set();
  const filteredEvents = [];
  for (const event of events) {
    if (usedIds.has(event.id)) {
      continue;
    }
    usedIds.add(event.id);
    filteredEvents.push(event);
  }

  return filteredEvents;
}

function createInterval(
  startString: string,
  startConstraint: Constraint,
  endString: string,
  endConstraint: Constraint,
  constraintData: ConstraintData
): {start?: Date; end?: Date; swapped?: boolean} {
  const {
    start: startDate,
    startUtc,
    end,
    endUtc,
    swapped,
  } = createDatesInterval(startString, startConstraint, endString, endConstraint, constraintData);

  if (swapped) {
    startConstraint = endConstraint;
    endConstraint = startConstraint;
  }

  let endDate = end;
  let startMoment = startUtc ? moment.utc(startDate) : moment(startDate);

  if (startConstraint?.type !== ConstraintType.Duration && !constraintContainsHoursInConfig(startConstraint)) {
    startMoment = startMoment.startOf('day');
    if (!endDate) {
      endDate = startMoment.toDate();
    }
  }

  let endMoment = endUtc ? moment.utc(endDate) : moment(endDate);
  if (!endDate) {
    return {start: startMoment.toDate()};
  } else if (!startDate) {
    return {end: endMoment.toDate()};
  }

  if (
    startConstraint?.type !== ConstraintType.Duration &&
    endConstraint?.type !== ConstraintType.Duration &&
    !constraintContainsHoursInConfig(endConstraint)
  ) {
    endMoment = endMoment.startOf('day').add(1, 'days');
  }

  return {start: startMoment.toDate(), end: endMoment?.toDate(), swapped};
}

function groupId(data: DataObjectInfo<any>): string {
  const nameDataResource = data.objectDataResources[DataObjectInfoKeyType.Name];
  const startDataResource = data.objectDataResources[DataObjectInfoKeyType.Start];
  const endDataResource = data.objectDataResources[DataObjectInfoKeyType.End];
  return [nameDataResource, startDataResource, endDataResource]
    .filter(resource => isNotNullOrUndefined(resource))
    .map(resource => resource.id)
    .join(':');
}
