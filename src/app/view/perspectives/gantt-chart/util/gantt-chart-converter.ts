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
  GanttChartConfig,
  GanttChartStemConfig,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {Collection} from '../../../../core/store/collections/collection';
import {
  isDateValid,
  isNotNullOrUndefined,
  isNullOrUndefined,
  isNumeric,
  toNumber,
} from '../../../../shared/utils/common.utils';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {AllowedPermissions, mergeAllowedPermissions} from '../../../../core/model/allowed-permissions';
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
import {Query} from '../../../../core/store/navigation/query/query';
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
import {Task as GanttChartTask} from '@lumeer/lumeer-gantt/dist/model/task';
import {GanttOptions, GanttSwimlaneInfo} from '@lumeer/lumeer-gantt/dist/model/options';
import {environment} from '../../../../../environments/environment';
import {COLOR_PRIMARY} from '../../../../core/constants';

const MIN_PROGRESS = 0.001;
const MAX_PROGRESS = 1000;

type DataResourceSwimlanes = DataResource & {swimlanes?: string[]};

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
  ): {options: GanttOptions; tasks: GanttChartTask[]} {
    this.updateData(config, collections, documents, linkTypes, linkInstances, permissions, constraintData, query);

    const options = this.createGanttOptions(config);

    const tasks = ((query && query.stems) || []).reduce((allTasks, stem, index) => {
      this.dataAggregator.updateData(collections, documents, linkTypes, linkInstances, stem, constraintData);
      allTasks.push(...this.convertByStem(index));
      return allTasks;
    }, []);

    return {options, tasks};
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

  private createGanttOptions(config: GanttChartConfig): GanttOptions {
    const isOnlyOneCollection = isOnlyOneResourceConfig(config);

    return {
      swimlaneInfo: this.convertSwimlaneInfo(config),
      resizeTaskRight: true,
      resizeProgress: true,
      resizeTaskLeft: true,
      resizeTaskSwimlanes: true,
      dragTaskSwimlanes: isOnlyOneCollection,
      createTasks: isOnlyOneCollection,
      language: environment.locale,
      lockResize: config.lockResize || false,
      padding: config.padding,
      dateFormat: GANTT_DATE_FORMAT,
      columnWidth: config.columnWidth,
      barHeight: config.barHeight,
      viewMode: config.mode as any,
    };
  }

  private convertSwimlaneInfo(config: GanttChartConfig): GanttSwimlaneInfo[] {
    const categories = (config.stemsConfigs || []).reduce<GanttChartBarModel[][]>((arr, stemConfig) => {
      (stemConfig.categories || []).forEach((category, index) => {
        if (arr[index]) {
          arr[index].push(category);
        } else {
          arr[index] = [category];
        }
      });
      return arr;
    }, []);
    const categoriesLength = categories.length;

    if (config.showDates) {
      categories.push(
        (config.stemsConfigs || []).filter(stemConfig => !!stemConfig.start).map(stemConfig => stemConfig.start)
      );
      categories.push(
        (config.stemsConfigs || []).filter(stemConfig => !!stemConfig.end).map(stemConfig => stemConfig.end)
      );
    }

    return categories.map((cat, index) =>
      this.convertGanttBarToSwimlaneInfo(
        cat.length === 1 && cat[0],
        config.swimlaneWidths && config.swimlaneWidths[index],
        index >= categoriesLength
      )
    );
  }

  private convertGanttBarToSwimlaneInfo(
    model: GanttChartBarModel,
    width: number,
    isStatic: boolean
  ): GanttSwimlaneInfo {
    let title = '';
    let background = null;
    if (model) {
      const resource = this.getResource(model);
      background = shadeColor((<Collection>resource).color, 0.5);
      const attribute = resource && findAttribute(resource.attributes, model.attributeId);
      title = attribute.name;
    }
    return {
      background,
      color: COLOR_PRIMARY,
      static: isStatic,
      width,
      title,
    };
  }

  private convertByStem(index: number): GanttChartTask[] {
    const stemConfig = this.config && this.config.stemsConfigs && this.config.stemsConfigs[index];
    if (this.requiredPropertiesAreSet(stemConfig)) {
      if (this.shouldAggregate(stemConfig)) {
        return this.convertByAggregation(stemConfig, this.config.showDates);
      }
      return this.convertSimple(stemConfig, this.config.showDates);
    }
    return [];
  }

  private convertByAggregation(stemConfig: GanttChartStemConfig, showDatesAsSwimlanes: boolean): GanttChartTask[] {
    const resource = this.getResource(stemConfig.start);

    const rowAttributes = (stemConfig.categories || [])
      .filter(property => isNotNullOrUndefined(property))
      .map(property => this.convertGanttProperty(property));
    const valueAttributes = [this.convertGanttProperty(stemConfig.start)];
    const aggregatedData = this.dataAggregator.aggregate(rowAttributes, [], valueAttributes);

    const dataResourcesSwimlanes: DataResourceSwimlanes[] = [];
    this.convertByAggregationRecursive(
      stemConfig,
      aggregatedData.map,
      0,
      aggregatedData.rowLevels - 1,
      [],
      dataResourcesSwimlanes
    );

    return this.createGanttChartTasksForResource(stemConfig, resource, dataResourcesSwimlanes, showDatesAsSwimlanes);
  }

  private convertByAggregationRecursive(
    stemConfig: GanttChartStemConfig,
    map: Record<string, any>,
    level: number,
    maxLevel: number,
    swimlanes: string[],
    dataResourcesSwimlanes: DataResourceSwimlanes[]
  ) {
    const property = stemConfig.categories[level];
    const constraint = this.getConstraint(property);
    for (const swimlaneValue of Object.keys(map)) {
      const swimlane = this.formatSwimlaneValue(swimlaneValue, constraint, property);
      if (level === maxLevel) {
        const aggregatedDataValues = map[swimlaneValue] as AggregatedDataValues[];
        const dataResources = aggregatedDataValues[0].objects;
        dataResourcesSwimlanes.push(...dataResources.map(dr => ({...dr, swimlanes: [...swimlanes, swimlane]})));
      } else {
        this.convertByAggregationRecursive(
          stemConfig,
          map[swimlaneValue],
          level + 1,
          maxLevel,
          [...swimlanes, swimlane],
          dataResourcesSwimlanes
        );
      }
    }
  }

  private convertGanttProperty(property: GanttChartBarModel): DataAggregatorAttribute {
    return {attributeId: property.attributeId, resourceIndex: property.resourceIndex, data: property.constraint};
  }

  private convertSimple(stemConfig: GanttChartStemConfig, showDatesAsSwimlanes: boolean): GanttChartTask[] {
    const startProperty = stemConfig.start;
    const dataResources = this.dataAggregator.getDataResources(startProperty.resourceIndex);
    const resource = this.getResource(startProperty);

    return this.createGanttChartTasksForResource(stemConfig, resource, dataResources, showDatesAsSwimlanes);
  }

  private createGanttChartTasksForResource(
    stemConfig: GanttChartStemConfig,
    resource: AttributesResource,
    dataResources: DataResourceSwimlanes[],
    showDatesAsSwimlanes: boolean
  ): GanttChartTask[] {
    const validIds = [];
    const validDataResourceIdsMap: Record<string, string[]> = dataResources.reduce((map, dataResource) => {
      const start = stemConfig.start && dataResource.data[stemConfig.start.attributeId];
      const end = stemConfig.end && dataResource.data[stemConfig.end.attributeId];
      if (isTaskValid(start, end)) {
        validIds.push(dataResource.id);
        const parentId = (<DocumentModel>dataResource).metaData && (<DocumentModel>dataResource).metaData.parentId;
        if (map[parentId]) {
          map[parentId].push(dataResource.id);
        } else {
          map[parentId] = [dataResource.id];
        }
      }
      return map;
    }, {});

    return dataResources.reduce<GanttChartTask[]>((arr, dataResource) => {
      const formattedData = formatData(dataResource.data, resource.attributes, this.constraintData);

      const name = stemConfig.name && dataResource.data[stemConfig.name.attributeId];
      const nameAttribute = stemConfig.name && findAttribute(resource.attributes, stemConfig.name.attributeId);

      const start = stemConfig.start && dataResource.data[stemConfig.start.attributeId];
      const startEditable = this.isPropertyEditable(stemConfig.start);

      const end = stemConfig.end && dataResource.data[stemConfig.end.attributeId];
      const endEditable = this.isPropertyEditable(stemConfig.end);

      if (!isTaskValid(start, end)) {
        return arr;
      }

      const interval = createInterval(
        start,
        startEditable && stemConfig.start.attributeId,
        end,
        endEditable && stemConfig.end.attributeId
      );
      const progress = stemConfig.progress && (formattedData[stemConfig.progress.attributeId] || 0);
      const progressEditable = stemConfig.progress && this.isPropertyEditable(stemConfig.progress);

      const resourceColor = this.getPropertyColor(stemConfig.start);
      const dataResourceColor = stemConfig.color && dataResource.data[stemConfig.color.attributeId];
      const colorConstraint =
        stemConfig.color && findAttributeConstraint(resource.attributes, stemConfig.color.attributeId);
      const formattedColor =
        stemConfig.color &&
        formatColorDataValue(dataResourceColor, colorConstraint && (colorConstraint.config as ColorConstraintConfig));
      const taskColor =
        dataResourceColor && isColorValid(formattedColor)
          ? validDataColors[dataResourceColor] || dataResourceColor
          : resourceColor;

      const permission = this.getPermission(stemConfig.start);

      const datesSwimlanes = [];
      if (showDatesAsSwimlanes) {
        const startString = formatDataValue(start, this.getConstraint(stemConfig.start), this.constraintData);
        const endString = formatDataValue(end, this.getConstraint(stemConfig.end), this.constraintData);
        datesSwimlanes.push(...[startString, endString]);
      }

      arr.push({
        id: dataResource.id,
        name: formatDataValue(name, nameAttribute && nameAttribute.constraint, this.constraintData),
        start: interval[0].value,
        end: interval[1].value,
        progress: createProgress(progress),
        dependencies: validDataResourceIdsMap[dataResource.id] || [],
        allowedDependencies: validIds,
        barColor: shadeColor(taskColor, 0.5),
        progressColor: shadeColor(taskColor, 0.3),
        startDrag: startEditable,
        endDrag: endEditable,
        progressDrag: progressEditable,
        editable: permission && permission.writeWithView,
        textColor: contrastColor(shadeColor(taskColor, 0.5)),
        swimlanes: [...(dataResource.swimlanes || []), ...datesSwimlanes],

        metadata: {
          dataResourceId: dataResource.id,
          startAttributeId: interval[0].attrId,
          endAttributeId: interval[1].attrId,
          progressAttributeId: progressEditable && stemConfig.progress && stemConfig.progress.attributeId,
          resourceId: resource.id,
          resourceType: stemConfig.start.resourceType,
        },
      });

      return arr;
    }, []);
  }

  private isPropertyEditable(model: GanttChartBarModel): boolean {
    if (model.resourceType === AttributesResourceType.Collection) {
      const collection = (this.collections || []).find(coll => coll.id === model.resourceId);
      return (
        collection &&
        isCollectionAttributeEditable(model.attributeId, collection, this.getPermission(model), this.query)
      );
    } else if (model.resourceType === AttributesResourceType.LinkType) {
      const linkType = (this.linkTypes || []).find(lt => lt.id === model.resourceId);
      return (
        linkType && isLinkTypeAttributeEditable(model.attributeId, linkType, this.getPermission(model), this.query)
      );
    }

    return false;
  }

  private getPermission(model: GanttChartBarModel): AllowedPermissions {
    const resource = this.getResource(model);
    if (model.resourceType === AttributesResourceType.Collection) {
      return resource && this.permissions[resource.id];
    } else {
      return (
        resource &&
        mergeAllowedPermissions(
          this.permissions[(<LinkType>resource).collectionIds[0]],
          this.permissions[(<LinkType>resource).collectionIds[1]]
        )
      );
    }
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

  private requiredPropertiesAreSet(stemConfig: GanttChartStemConfig): boolean {
    return !!stemConfig.start && !!stemConfig.end;
  }

  private shouldAggregate(stemConfig: GanttChartStemConfig): boolean {
    return (stemConfig.categories || []).length > 0;
  }

  public formatSwimlaneValue(value: any, constraint: Constraint, barModel: GanttChartBarModel): string | null {
    const overrideConstraint =
      barModel.constraint && this.formatter.checkValidConstraintOverride(constraint, barModel.constraint);

    const formattedValue = formatDataValue(value, overrideConstraint || constraint, this.constraintData);
    return formattedValue && formattedValue !== '' ? formattedValue.toString() : undefined;
  }
}

function isTaskValid(start: string, end: string): boolean {
  return areDatesValid(start, end);
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

function isOnlyOneResourceConfig(config: GanttChartConfig): boolean {
  if ((config.stemsConfigs || []).length !== 1) {
    return false;
  }

  return config.stemsConfigs[0].stem && (config.stemsConfigs[0].stem.linkTypeIds || []).length === 0;
}
