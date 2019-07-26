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

import {Constraint, ConstraintData} from '../../../../core/model/data/constraint';
import {ColorConstraintConfig} from '../../../../core/model/data/constraint-config';
import {
  GANTT_DATE_FORMAT,
  GanttChartBarModel,
  GanttChartBarPropertyOptional,
  GanttChartBarPropertyRequired,
  GanttChartConfig,
  GanttChartTask,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {Collection} from '../../../../core/store/collections/collection';
import {
  isArray,
  isDateValid,
  isNotNullOrUndefined,
  isNullOrUndefined,
  isNumeric,
  toNumber,
} from '../../../../shared/utils/common.utils';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {
  formatColorDataValue,
  formatData,
  formatDataValue,
  isColorValid,
  parseDateTimeDataValue,
} from '../../../../shared/utils/data.utils';
import {
  findAttribute,
  findAttributeConstraint,
  isCollectionAttributeEditable,
  isLinkTypeAttributeEditable,
} from '../../../../core/store/collections/collection.util';
import {Query} from '../../../../core/store/navigation/query';
import {shadeColor} from '../../../../shared/utils/html-modifier';
import {contrastColor} from '../../../../shared/utils/color.utils';
import * as moment from 'moment';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {
  AggregatedDataValues,
  DataAggregator,
  DataAggregatorAttribute,
} from '../../../../shared/utils/data/data-aggregator';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {validDataColors} from '../../../../shared/utils/data/valid-data-colors';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';

const MIN_PROGRESS = 0.001;
const MAX_PROGRESS = 1000;

type DataResourceSwimlanes = DataResource & {swimlane?: string; subSwimlane?: string};

export class GanttChartConverter {
  private collections: Collection[];
  private documents: DocumentModel[];
  private linkTypes: LinkType[];
  private linkInstances: LinkInstance[];
  private config: GanttChartConfig;
  private constraintData?: ConstraintData;
  private permissions: Record<string, AllowedPermissions>;
  private query: Query;

  private dataAggregator = new DataAggregator();

  constructor(private formatter: SelectItemWithConstraintFormatter) {}

  public convert(
    config: GanttChartConfig,
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    permissions: Record<string, AllowedPermissions>,
    constraintData: ConstraintData,
    query: Query
  ): GanttChartTask[] {
    this.updateData(config, collections, documents, linkTypes, linkInstances, permissions, constraintData, query);

    const usedTaskIds = new Set<string>();
    return ((query && query.stems) || []).reduce((tasks, stem, index) => {
      this.dataAggregator.updateData(collections, documents, linkTypes, linkInstances, stem, constraintData);
      tasks.push(...this.convertByStem(index, usedTaskIds));
      return tasks;
    }, []);
  }

  private updateData(
    config: GanttChartConfig,
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    permissions: Record<string, AllowedPermissions>,
    constraintData: ConstraintData,
    query: Query
  ) {
    this.config = config;
    this.collections = collections;
    this.documents = documents;
    this.linkTypes = linkTypes;
    this.linkInstances = linkInstances;
    this.permissions = permissions;
    this.constraintData = constraintData;
    this.query = query;
  }

  private convertByStem(index: number, usedTaskIds: Set<string>): GanttChartTask[] {
    const stemConfig = this.config && this.config.stemsConfigs && this.config.stemsConfigs[index];
    const stemProperties = (stemConfig && stemConfig.barsProperties) || {};
    if (this.requiredPropertiesAreSet(stemProperties)) {
      if (this.shouldAggregate(stemProperties)) {
        return this.convertByAggregation(stemProperties, usedTaskIds);
      }
      return this.convertSimple(stemProperties, usedTaskIds);
    }
    return [];
  }

  private convertByAggregation(
    properties: Record<string, GanttChartBarModel>,
    usedTaskIds: Set<string>
  ): GanttChartTask[] {
    const startProperty = properties[GanttChartBarPropertyRequired.Start];
    const resource = this.getResource(startProperty);

    const categoryProperty = properties[GanttChartBarPropertyOptional.Category];
    const categoryConstraint = categoryProperty && this.getConstraint(categoryProperty);

    const subCategoryProperty = properties[GanttChartBarPropertyOptional.SubCategory];
    const subCategoryConstraint = subCategoryProperty && this.getConstraint(subCategoryProperty);

    const rowAttributes = [categoryProperty, subCategoryProperty]
      .filter(property => isNotNullOrUndefined(property))
      .map(property => this.convertGanttProperty(property));
    const valueAttributes = [this.convertGanttProperty(startProperty)];
    const aggregatedData = this.dataAggregator.aggregate(rowAttributes, [], valueAttributes);

    const dataResourcesSwimlanes: DataResourceSwimlanes[] = [];

    for (const swimlaneValue of Object.keys(aggregatedData.map)) {
      const swimlaneMapOrValues = aggregatedData.map[swimlaneValue];
      const swimlane = this.formatSwimlaneValue(swimlaneValue, categoryConstraint, categoryProperty);

      if (isArray(swimlaneMapOrValues)) {
        const aggregatedDataValues = swimlaneMapOrValues as AggregatedDataValues[];
        const dataResources = aggregatedDataValues[0].objects;
        dataResourcesSwimlanes.push(...dataResources.map(dr => ({...dr, swimlane})));
      } else {
        for (const sumSwimlaneValue of Object.keys(swimlaneMapOrValues)) {
          const subSwimlane = this.formatSwimlaneValue(sumSwimlaneValue, subCategoryConstraint, subCategoryProperty);

          const aggregatedDataValues = swimlaneMapOrValues[sumSwimlaneValue] as AggregatedDataValues[];
          const dataResources = aggregatedDataValues[0].objects;
          dataResourcesSwimlanes.push(...dataResources.map(dr => ({...dr, swimlane, subSwimlane})));
        }
      }
    }

    return this.createGanttChartTasksForResource(properties, resource, dataResourcesSwimlanes, usedTaskIds);
  }

  private convertGanttProperty(property: GanttChartBarModel): DataAggregatorAttribute {
    return {attributeId: property.attributeId, resourceIndex: property.resourceIndex};
  }

  private convertSimple(properties: Record<string, GanttChartBarModel>, usedTaskIds: Set<string>): GanttChartTask[] {
    const startProperty = properties[GanttChartBarPropertyRequired.Start];
    const dataResources = this.dataAggregator.getDataResources(startProperty.resourceIndex);
    const resource = this.getResource(startProperty);

    return this.createGanttChartTasksForResource(properties, resource, dataResources, usedTaskIds);
  }

  private createGanttChartTasksForResource(
    properties: Record<string, GanttChartBarModel>,
    resource: AttributesResource,
    dataResources: DataResourceSwimlanes[],
    usedTaskIds: Set<string>
  ): GanttChartTask[] {
    if (!properties) {
      return [];
    }

    const nameProperty = properties[GanttChartBarPropertyRequired.Name];
    const startProperty = properties[GanttChartBarPropertyRequired.Start];
    const endProperty = properties[GanttChartBarPropertyRequired.End];
    const progressProperty = properties[GanttChartBarPropertyOptional.Progress];
    const colorProperty = properties[GanttChartBarPropertyOptional.Color];

    const validTaskIds = [];
    const validDataResourceIdsMap: Record<string, string[]> = dataResources.reduce((map, dataResource) => {
      const name = nameProperty && dataResource.data[nameProperty.attributeId];
      const start = startProperty && dataResource.data[startProperty.attributeId];
      const end = endProperty && dataResource.data[endProperty.attributeId];
      if (isTaskValid(name, start, end)) {
        const taskId = createGanttChartTaskId(dataResource, new Set<string>(usedTaskIds));
        validTaskIds.push(taskId);
        if (map[dataResource.id]) {
          map[dataResource.id].push(taskId);
        } else {
          map[dataResource.id] = [taskId];
        }
      }
      return map;
    }, {});

    const tasksIdsString = validTaskIds.join(',');

    return dataResources.reduce((arr, dataResource) => {
      const formattedData = formatData(dataResource.data, resource.attributes, this.constraintData);

      const name = nameProperty && dataResource.data[nameProperty.attributeId];
      const nameAttribute = nameProperty && findAttribute(resource.attributes, nameProperty.attributeId);

      const start = startProperty && dataResource.data[startProperty.attributeId];
      const startEditable = this.isPropertyEditable(startProperty);

      const end = endProperty && dataResource.data[endProperty.attributeId];
      const endEditable = this.isPropertyEditable(endProperty);

      if (!isTaskValid(name, start, end)) {
        return arr;
      }

      const interval = createInterval(
        start,
        startEditable && startProperty.attributeId,
        end,
        endEditable && endProperty.attributeId
      );
      const progress = progressProperty && (formattedData[progressProperty.attributeId] || 0);
      const progressEditable = progressProperty && this.isPropertyEditable(progressProperty);

      const resourceColor = this.getPropertyColor(startProperty);
      const dataResourceColor = colorProperty && dataResource.data[colorProperty.attributeId];
      const colorConstraint = colorProperty && findAttributeConstraint(resource.attributes, colorProperty.attributeId);
      const formattedColor =
        colorProperty &&
        formatColorDataValue(dataResourceColor, colorConstraint && (colorConstraint.config as ColorConstraintConfig));
      const taskColor =
        dataResourceColor && isColorValid(formattedColor)
          ? validDataColors[dataResourceColor] || dataResourceColor
          : resourceColor;

      arr.push({
        id: createGanttChartTaskId(dataResource, usedTaskIds),
        name: formatDataValue(name, nameAttribute && nameAttribute.constraint, this.constraintData),
        start: interval[0].value,
        end: interval[1].value,
        progress: createProgress(progress),
        dependencies: createDependencies(dataResource, validDataResourceIdsMap),
        allowed_dependencies: tasksIdsString,
        primary_color: shadeColor(taskColor, 0.5),
        secondary_color: shadeColor(taskColor, 0.3),
        start_drag: startEditable,
        end_drag: endEditable,
        editable: startEditable && endEditable,
        text_color: contrastColor(shadeColor(taskColor, 0.5)),
        swimlane: dataResource.swimlane,
        sub_swimlane: dataResource.subSwimlane,

        metadata: {
          dataResourceId: dataResource.id,
          startAttributeId: interval[0].attrId,
          endAttributeId: interval[1].attrId,
          progressAttributeId: progressEditable && progressProperty && progressProperty.attributeId,
          resourceId: resource.id,
          resourceType: startProperty.resourceType,
        },
      });

      return arr;
    }, []);
  }

  private isPropertyEditable(model: GanttChartBarModel): boolean {
    if (model.resourceType === AttributesResourceType.Collection) {
      const collection = (this.collections || []).find(coll => coll.id === model.resourceId);
      return collection && isCollectionAttributeEditable(model.attributeId, collection, this.permissions, this.query);
    } else if (model.resourceType === AttributesResourceType.LinkType) {
      const linkType = (this.linkTypes || []).find(lt => lt.id === model.resourceId);
      return linkType && isLinkTypeAttributeEditable(model.attributeId, linkType, this.permissions, this.query);
    }

    return false;
  }

  private getResource(model: GanttChartBarModel): AttributesResource {
    if (model.resourceType === AttributesResourceType.Collection) {
      return (this.collections || []).find(collection => collection.id === model.resourceId);
    } else if (model.resourceType === AttributesResourceType.LinkType) {
      return (this.linkTypes || []).find(linkTypes => linkTypes.id === model.resourceId);
    }

    return null;
  }

  private getConstraint(model: GanttChartBarModel): Constraint {
    const resource = this.getResource(model);
    return resource && findAttributeConstraint(resource.attributes, model.attributeId);
  }

  private getPropertyColor(model: GanttChartBarModel): string {
    const resource = this.dataAggregator.getNextCollectionResource(model.resourceIndex);
    return resource && (<Collection>resource).color;
  }

  private requiredPropertiesAreSet(properties: Record<string, GanttChartBarModel>): boolean {
    return Object.values(GanttChartBarPropertyRequired).every(property => !!properties[property]);
  }

  private shouldAggregate(properties: Record<string, GanttChartBarModel>): boolean {
    return !!properties[GanttChartBarPropertyOptional.Category];
  }

  public formatSwimlaneValue(value: any, constraint: Constraint, barModel: GanttChartBarModel): string | null {
    const overrideConstraint =
      barModel.constraint && this.formatter.checkValidConstraintOverride(constraint, barModel.constraint);

    const formattedValue = formatDataValue(value, overrideConstraint || constraint, this.constraintData);
    return formattedValue && formattedValue !== '' ? formattedValue.toString() : undefined;
  }
}

function createGanttChartTaskId(dataResource: DataResourceSwimlanes, usedTaskIds: Set<string>): string {
  let id = [dataResource.swimlane, dataResource.subSwimlane, dataResource.id].filter(val => !!val).join(':');
  let num = 0;
  while (usedTaskIds.has(id)) {
    id = id + num++;
  }

  usedTaskIds.add(id);
  return id;
}

function createDependencies(dataResource: DataResource, validTaskIdsMap: Record<string, string[]>): string {
  const parentId = (<DocumentModel>dataResource).metaData && (<DocumentModel>dataResource).metaData.parentId;
  if (parentId && validTaskIdsMap[parentId]) {
    return validTaskIdsMap[parentId].join(',');
  }
  return '';
}

function isTaskValid(name: string, start: string, end: string): boolean {
  return name && areDatesValid(start, end);
}

function areDatesValid(start: string, end: string): boolean {
  return isDateValid(parseDateTimeDataValue(start)) && isDateValid(parseDateTimeDataValue(end));
}

function createProgress(progress: any): number {
  if (isNullOrUndefined(progress)) {
    return MIN_PROGRESS;
  }

  const progressWithoutPercent = progress.toString().replace(/%*$/g, '');
  if (isNumeric(progressWithoutPercent)) {
    return Math.min(Math.max(toNumber(progressWithoutPercent), MIN_PROGRESS), MAX_PROGRESS);
  }
  return MIN_PROGRESS;
}

function createInterval(
  start: string,
  startAttributeId: string,
  end: string,
  endAttributeId: string
): [{value: string; attrId: string}, {value: string; attrId: string}] {
  const startDate = parseDateTimeDataValue(start);
  const endDate = parseDateTimeDataValue(end);

  const startDateObj = {value: moment(startDate).format(GANTT_DATE_FORMAT), attrId: startAttributeId};
  const endDateObj = {value: moment(endDate).format(GANTT_DATE_FORMAT), attrId: endAttributeId};

  if (endDate.getTime() > startDate.getTime()) {
    return [startDateObj, endDateObj];
  }
  return [endDateObj, startDateObj];
}
