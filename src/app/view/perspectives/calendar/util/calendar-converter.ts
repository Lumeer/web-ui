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

import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Query} from '../../../../core/store/navigation/query/query';
import {CalendarBar, CalendarConfig, CalendarStemConfig} from '../../../../core/store/calendars/calendar';
import {CalendarEvent} from './calendar-event';
import {isArray, isDateValid, isNotNullOrUndefined, objectsByIdMap} from '../../../../shared/utils/common.utils';
import {
  DataObjectAggregator,
  DataObjectAttribute,
  DataObjectInfo,
} from '../../../../shared/utils/data/data-object-aggregator';
import {QueryAttribute, queryAttributePermissions} from '../../../../core/model/query-attribute';
import {Constraint} from '../../../../core/model/constraint';
import {
  findAttributeConstraint,
  isCollectionAttributeEditable,
  isLinkTypeAttributeEditable,
} from '../../../../core/store/collections/collection.util';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {isAllDayEvent} from './calendar-util';
import {createDatesInterval, parseDateTimeByConstraint} from '../../../../shared/utils/date.utils';
import {stripTextHtmlTags} from '../../../../shared/utils/data.utils';
import {shadeColor} from '../../../../shared/utils/html-modifier';
import {contrastColor} from '../../../../shared/utils/color.utils';
import {generateId} from '../../../../shared/utils/resource.utils';

enum DataObjectInfoKeyType {
  Name = 'name',
  Start = 'start',
  End = 'end',
  Color = 'color',
}

export class CalendarConverter {
  private collectionsMap: Record<string, Collection>;
  private linkTypesMap: Record<string, LinkType>;
  private config: CalendarConfig;
  private constraintData?: ConstraintData;
  private permissions: Record<string, AllowedPermissions>;
  private query: Query;

  private dataObjectAggregator = new DataObjectAggregator<any>();

  public convert(
    config: CalendarConfig,
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    permissions: Record<string, AllowedPermissions>,
    constraintData: ConstraintData,
    query: Query
  ): CalendarEvent[] {
    this.updateData(config, collections, linkTypes, permissions, constraintData, query);

    return (query?.stems || []).reduce((allEvents, stem, index) => {
      this.dataObjectAggregator.updateData(collections, documents, linkTypes, linkInstances, stem, constraintData);
      allEvents.push(...this.convertByStem(index));
      return allEvents;
    }, []);
  }

  private updateData(
    config: CalendarConfig,
    collections: Collection[],
    linkTypes: LinkType[],
    permissions: Record<string, AllowedPermissions>,
    constraintData: ConstraintData,
    query: Query
  ) {
    this.config = config;
    this.collectionsMap = objectsByIdMap(collections);
    this.linkTypesMap = objectsByIdMap(linkTypes);
    this.permissions = permissions;
    this.constraintData = constraintData;
    this.query = query;
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

    const dataObjectsInfo = this.dataObjectAggregator.convert({
      groupingAttributes: [],
      objectAttributes,
      metaAttributes,
    });

    return this.createCalendarEventsForStem(stemConfig, dataObjectsInfo, stemIndex);
  }

  private createCalendarEventsForStem(
    stemConfig: CalendarStemConfig,
    dataObjectsInfo: DataObjectInfo<any>[],
    stemIndex: number
  ): CalendarEvent[] {
    const nameConstraint = this.findConstraintForModel(stemConfig.name);

    const startEditable = this.isPropertyEditable(stemConfig.start);
    const startConstraint = this.findConstraintForModel(stemConfig.start);
    const startPermission = this.modelPermissions(stemConfig.start);

    const endEditable = this.isPropertyEditable(stemConfig.end);
    const endConstraint = this.findConstraintForModel(stemConfig.end);
    const endPermission = this.modelPermissions(stemConfig.end);

    return dataObjectsInfo.reduce<CalendarEvent[]>((events, item) => {
      const startDataResource = item.objectDataResources[DataObjectInfoKeyType.Start];
      const start = stemConfig.start && startDataResource?.data[stemConfig.start.attributeId];
      const startDate = parseDateTimeByConstraint(start, startConstraint);
      if (!isDateValid(startDate)) {
        return events;
      }

      const nameDataResource = item.objectDataResources[DataObjectInfoKeyType.Name];
      const name = (stemConfig.name && nameDataResource?.data[stemConfig.name.attributeId]) || '';

      const endDataResource = item.objectDataResources[DataObjectInfoKeyType.End];
      const end = stemConfig.end && endDataResource?.data[stemConfig.end.attributeId];

      const colorDataResources = item.metaDataResources[DataObjectInfoKeyType.Color] || [];
      const resourceColor = this.getPropertyColor(stemConfig.name || stemConfig.start);
      const eventColor = this.parseColor(stemConfig.color, colorDataResources);

      const interval = createDatesInterval(start, startConstraint, end, endConstraint, this.constraintData);
      const allDay = isAllDayEvent(interval.start, interval.end);

      const titles = isArray(name) ? name : [name];
      for (let i = 0; i < titles.length; i++) {
        const titleFormatted = stripTextHtmlTags(
          nameConstraint.createDataValue(titles[i], this.constraintData).preview(),
          false
        );

        const backgroundColor = eventColor || shadeColor(resourceColor, 0.5);
        const event: CalendarEvent = {
          id: generateId(),
          groupId: groupId(item),
          title: titleFormatted,
          start: interval.start,
          end: interval.end,
          backgroundColor,
          borderColor: eventColor || shadeColor(resourceColor, 0.4),
          textColor: contrastColor(backgroundColor),
          allDay,
          startEditable: startEditable && startPermission?.writeWithView,
          durationEditable: interval.end && stemConfig.end && endEditable && endPermission?.writeWithView,
          extendedProps: {
            startDataId: interval.swapped ? endDataResource?.id : startDataResource?.id,
            endDataId: interval.swapped ? startDataResource?.id : endDataResource?.id,
            nameDataId: nameDataResource?.id,
            stemConfig: interval.swapped ? {...stemConfig, start: stemConfig.end, end: stemConfig.start} : stemConfig,
            stemIndex,
            dataResourcesChain: item.dataResourcesChain,
          },
        };

        events.push(event);
      }

      return events;
    }, []);
  }

  private parseColor(model: CalendarBar, dataResources: DataResource[]): string {
    const constraint = this.findConstraintForModel(model);
    const values = (model && (dataResources || []).map(dataResource => dataResource.data[model.attributeId])) || [];
    return this.dataObjectAggregator.parseColor(constraint, values);
  }

  private getPropertyColor(model: QueryAttribute): string {
    const resource = this.dataObjectAggregator.getNextCollectionResource(model.resourceIndex);
    return resource && (<Collection>resource).color;
  }

  private findConstraintForModel(model: QueryAttribute): Constraint {
    const resource = model && this.getResource(model);
    return (resource && findAttributeConstraint(resource.attributes, model.attributeId)) || new UnknownConstraint();
  }

  private isPropertyEditable(model: CalendarBar): boolean {
    if (model && model.resourceType === AttributesResourceType.Collection) {
      const collection = this.collectionsMap[model.resourceId];
      return (
        collection &&
        isCollectionAttributeEditable(model.attributeId, collection, this.modelPermissions(model), this.query)
      );
    } else if (model && model.resourceType === AttributesResourceType.LinkType) {
      const linkType = this.linkTypesMap[model.resourceId];
      return (
        linkType && isLinkTypeAttributeEditable(model.attributeId, linkType, this.modelPermissions(model), this.query)
      );
    }

    return false;
  }

  private modelPermissions(model: CalendarBar): AllowedPermissions {
    if (!model) {
      return {};
    }

    return queryAttributePermissions(model, this.permissions, this.linkTypesMap);
  }

  private getResource(model: CalendarBar): AttributesResource {
    if (model.resourceType === AttributesResourceType.Collection) {
      return this.collectionsMap[model.resourceId];
    } else if (model.resourceType === AttributesResourceType.LinkType) {
      return this.linkTypesMap[model.resourceId];
    }

    return null;
  }
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
