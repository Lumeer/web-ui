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

import {GanttOptions, GanttSwimlaneInfo} from '@lumeer/lumeer-gantt/dist/model/options';
import {Task as GanttChartTask} from '@lumeer/lumeer-gantt/dist/model/task';
import * as moment from 'moment';
import {environment} from '../../../../../environments/environment';
import {COLOR_PRIMARY} from '../../../../core/constants';
import {AllowedPermissions, mergeAllowedPermissions} from '../../../../core/model/allowed-permissions';
import {Constraint} from '../../../../core/model/constraint';
import {UnknownConstraint} from '../../../../core/model/constraint/unknown.constraint';
import {ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import {DateTimeConstraintConfig, PercentageConstraintConfig} from '../../../../core/model/data/constraint-config';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {Collection} from '../../../../core/store/collections/collection';
import {
  findAttribute,
  findAttributeConstraint,
  isCollectionAttributeEditable,
  isLinkTypeAttributeEditable,
} from '../../../../core/store/collections/collection.util';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {
  GANTT_DATE_FORMAT,
  GanttChartBarModel,
  GanttChartConfig,
  GanttChartStemConfig,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query} from '../../../../core/store/navigation/query/query';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {contrastColor} from '../../../../shared/utils/color.utils';
import {
  isArray,
  isDateValid,
  isNotNullOrUndefined,
  isNullOrUndefined,
  isNumeric,
  toNumber,
} from '../../../../shared/utils/common.utils';
import {parseDateTimeDataValue, stripTextHtmlTags} from '../../../../shared/utils/data.utils';
import {
  AggregatedDataItem,
  DataAggregator,
  DataAggregatorAttribute,
} from '../../../../shared/utils/data/data-aggregator';
import {shadeColor} from '../../../../shared/utils/html-modifier';
import {aggregateDataValues, DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {ColorConstraint} from '../../../../core/model/constraint/color.constraint';
import {uniqueValues} from '../../../../shared/utils/array.utils';

interface TaskHelperData {
  nameDataResource: DataResource;
  startDataResource: DataResource;
  endDataResource: DataResource;
  colorDataResources: DataResource[];
  progressDataResources: DataResource[];
  swimlanes: { value: any; title: string }[];
}

export interface GanttChartTaskMetadata {
  nameDataId: string;
  startDateDataId: string;
  endDateDataId: string;
  progressDataIds: string[];
  stemConfig: GanttChartStemConfig;
}

export class GanttChartConverter {
  private collectionsMap: Record<string, Collection>;
  private linkTypesMap: Record<string, LinkType>;
  private documents: DocumentModel[];
  private linkInstances: LinkInstance[];
  private config: GanttChartConfig;
  private constraintData?: ConstraintData;
  private permissions: Record<string, AllowedPermissions>;
  private query: Query;

  private dataAggregator = new DataAggregator((value, constraint, data, aggregatorAttribute) => this.formatDataAggregatorValue(value, constraint, data, aggregatorAttribute));

  constructor(private formatter: SelectItemWithConstraintFormatter) {
  }

  public convert(
    config: GanttChartConfig,
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    permissions: Record<string, AllowedPermissions>,
    constraintData: ConstraintData,
    query: Query
  ): { options: GanttOptions; tasks: GanttChartTask[] } {
    this.updateData(config, collections, documents, linkTypes, linkInstances, permissions, constraintData, query);

    const options = this.createGanttOptions(config);

    const tasks = ((query && query.stems) || [])
      .reduce((allTasks, stem, index) => {
        this.dataAggregator.updateData(collections, documents, linkTypes, linkInstances, stem, constraintData);
        allTasks.push(...this.convertByStem(index));
        return allTasks;
      }, [])
      .sort((t1, t2) => this.compareTasks(t1, t2));

    return {options, tasks};
  }

  private compareTasks(t1: GanttChartTask, t2: GanttChartTask): number {
    const t1Start = moment(t1.start, GANTT_DATE_FORMAT);
    const t2Start = moment(t2.start, GANTT_DATE_FORMAT);
    return t1Start.isAfter(t2Start) ? 1 : t1Start.isBefore(t2Start) ? -1 : 0;
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
    this.collectionsMap = objectsMap(collections);
    this.documents = documents;
    this.linkTypesMap = objectsMap(linkTypes);
    this.linkInstances = linkInstances;
    this.permissions = permissions;
    this.constraintData = constraintData;
    this.query = query;
  }

  private createGanttOptions(config: GanttChartConfig): GanttOptions {
    return {
      swimlaneInfo: this.convertSwimlaneInfo(config),
      resizeTaskRight: true,
      resizeProgress: true,
      resizeTaskLeft: true,
      resizeSwimlanes: true,
      dragTaskSwimlanes: true,
      createTasks: true,
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
      return this.convertByAggregation(stemConfig, this.config.showDates);
    }
    return [];
  }

  private convertByAggregation(stemConfig: GanttChartStemConfig, showDatesAsSwimlanes: boolean): GanttChartTask[] {
    const aggregatorAttributes = (stemConfig.categories || [])
      .filter(property => isNotNullOrUndefined(property))
      .map(property => this.convertGanttProperty(property));

    if (stemConfig.name) {
      aggregatorAttributes.push({...this.convertGanttProperty(stemConfig.name), unique: true});
    }
    aggregatorAttributes.push(
      {...this.convertGanttProperty(stemConfig.start), unique: true},
      {...this.convertGanttProperty(stemConfig.end), unique: true}
    );

    const valueAttributes = [stemConfig.progress, stemConfig.color]
      .filter(property => isNotNullOrUndefined(property))
      .map(property => this.convertGanttProperty(property));

    const aggregatedData = this.dataAggregator.aggregateArray(aggregatorAttributes, valueAttributes);
    console.log(aggregatedData);

    const helperData: TaskHelperData[] = [];
    this.fillByAggregationRecursive(
      stemConfig,
      aggregatedData.items,
      0,
      (stemConfig.categories || []).length,
      [],
      helperData
    );

    return this.createGanttChartTasksForStem(stemConfig, helperData, showDatesAsSwimlanes);
  }

  private fillByAggregationRecursive(
    stemConfig: GanttChartStemConfig,
    items: AggregatedDataItem[],
    level: number,
    maxLevel: number,
    swimlanes: { value: any, title: string }[],
    helperData: TaskHelperData[]
  ) {
    if (level === maxLevel) {
      this.fillHelperData(helperData, stemConfig, items, swimlanes);
      return;
    }

    const property = stemConfig.categories[level];
    const constraint = this.findConstraintForModel(property);
    for (const item of items) {
      this.fillByAggregationRecursive(
        stemConfig,
        item.children,
        level + 1,
        maxLevel,
        [...swimlanes, this.formatSwimlaneValue(item.value, constraint, property)],
        helperData
      );
    }
  }

  private fillHelperData(
    helperData: TaskHelperData[],
    stemConfig: GanttChartStemConfig,
    items: AggregatedDataItem[],
    swimlanes: { value: any, title: string }[]
  ) {
    const allItems = stemConfig.name ? items : [{title: null, dataResources: [], children: items}];

    for (let nameIndex = 0; nameIndex < allItems.length; nameIndex++) {
      const nameItem = allItems[nameIndex];
      const nameDataResource = nameItem.dataResources[0];

      for (let startIndex = 0; startIndex < nameItem.children.length; startIndex++) {
        const startItem = nameItem.children[startIndex];
        const startDataResource = startItem.dataResources[0];

        for (let endIndex = 0; endIndex < startItem.children.length; endIndex++) {
          const endItem = startItem.children[endIndex];
          const endDataResource = endItem.dataResources[0];

          const values = endItem.values || [];
          const progressValues =
            stemConfig.progress &&
            values.find(
              value =>
                value.resourceId === stemConfig.progress.resourceId && value.type === stemConfig.progress.resourceType
            );
          const progressDataResources = (progressValues && progressValues.objects) || [];

          const colorValues =
            stemConfig.color &&
            values.find(
              value => value.resourceId === stemConfig.color.resourceId && value.type === stemConfig.color.resourceType
            );
          const colorDataResources = (colorValues && colorValues.objects) || [];

          helperData.push({
            nameDataResource,
            startDataResource,
            endDataResource,
            progressDataResources,
            colorDataResources,
            swimlanes,
          });
        }
      }
    }
  }

  private convertGanttProperty(property: GanttChartBarModel): DataAggregatorAttribute {
    return {attributeId: property.attributeId, resourceIndex: property.resourceIndex, data: property.constraint};
  }

  private createGanttChartTasksForStem(
    stemConfig: GanttChartStemConfig,
    helperData: TaskHelperData[],
    showDatesAsSwimlanes: boolean
  ): GanttChartTask[] {
    const validIds = [];
    const validDataResourceIdsMap: Record<string, string[]> = helperData.reduce((map, item) => {
      const start = stemConfig.start && item.startDataResource && item.startDataResource[stemConfig.start.attributeId];
      const end = stemConfig.end && item.endDataResource && item.endDataResource[stemConfig.end.attributeId];
      if (isTaskValid(start, end)) {
        const id = helperDataId(item);
        validIds.push(id);
        const dataResource = item.nameDataResource || item.startDataResource;
        const parentId = (<DocumentModel>dataResource).metaData && (<DocumentModel>dataResource).metaData.parentId;
        if (parentId) {
          if (map[parentId]) {
            map[parentId].push(id);
          } else {
            map[parentId] = [id];
          }
        }
      }
      return map;
    }, {});

    const nameConstraint = this.findConstraintForModel(stemConfig.name);

    const startEditable = this.isPropertyEditable(stemConfig.start);
    const startConstraint = this.findConstraintForModel(stemConfig.start);

    const endEditable = this.isPropertyEditable(stemConfig.end);
    const endConstraint = stemConfig.end && this.findConstraintForModel(stemConfig.end);

    const progressEditable = this.isPropertyEditable(stemConfig.progress);
    const progressConstraint = this.findConstraintForModel(stemConfig.progress);

    const colorConstraint = new ColorConstraint({});

    const permission = this.getPermission(stemConfig.start); // TODO ??

    return helperData.reduce<GanttChartTask[]>((arr, item) => {
      const name = stemConfig.name && item.nameDataResource && item.nameDataResource.data[stemConfig.name.attributeId];
      const start =
        stemConfig.start && item.startDataResource && item.startDataResource.data[stemConfig.start.attributeId];
      const end = stemConfig.end && item.endDataResource && item.endDataResource.data[stemConfig.end.attributeId];

      if (!isTaskValid(start, end)) {
        return arr;
      }

      const interval = createInterval(
        start,
        startEditable && stemConfig.start.attributeId,
        startConstraint,
        end,
        endEditable && stemConfig.end.attributeId,
        endConstraint
      );
      const progresses =
        (stemConfig.progress &&
          (item.progressDataResources || []).map(dataResource => dataResource.data[stemConfig.progress.attributeId])) ||
        [];
      const dataAggregationType = (stemConfig.progress && stemConfig.progress.aggregation) || DataAggregationType.Avg;
      const progressRaw = aggregateDataValues(dataAggregationType, progresses, progressConstraint, true);
      const progress = progressConstraint.createDataValue(progressRaw).format();

      const resourceColor = this.getPropertyColor(stemConfig.name || stemConfig.start);

      const colors =
        (stemConfig.color &&
          (item.colorDataResources || []).map(dataResource => dataResource.data[stemConfig.color.attributeId])) ||
        [];
      const colorDataValue = colors
        .map(color => colorConstraint.createDataValue(color))
        .find(dataValue => dataValue.isValid());
      const taskColor = colorDataValue ? colorDataValue.format() : resourceColor;

      const datesSwimlanes: { value: any, title: string }[] = [];
      if (showDatesAsSwimlanes) {
        const startString = (this.findConstraintForModel(stemConfig.start) || new UnknownConstraint())
          .createDataValue(start, this.constraintData)
          .format();
        const endString = (this.findConstraintForModel(stemConfig.end) || new UnknownConstraint())
          .createDataValue(end, this.constraintData)
          .format();
        datesSwimlanes.push(...[{value: startString, title: startString}, {value: endString, title: endString}]);
      }

      let minProgress,
        maxProgress = null;
      if (progressConstraint && progressConstraint.type === ConstraintType.Percentage) {
        const config = progressConstraint.config as PercentageConstraintConfig;
        minProgress = isNotNullOrUndefined(config.minValue) ? Math.max(0, config.minValue) : null;
        maxProgress = isNotNullOrUndefined(config.maxValue) ? config.maxValue : null;
      }

      const metadata: GanttChartTaskMetadata = {
        nameDataId: item.nameDataResource && item.nameDataResource.id,
        startDateDataId: item.startDataResource && item.startDataResource.id,
        endDateDataId: item.endDataResource && item.endDataResource.id,
        progressDataIds: (item.progressDataResources || []).map(dataResource => dataResource.id),
        stemConfig,
      };

      const names = isArray(name) ? name : [name];
      for (let i = 0; i < names.length; i++) {
        const nameFormatted = nameConstraint.createDataValue(names[i], this.constraintData).format();

        const taskId = helperDataId(item);
        arr.push({
          id: taskId,
          name: stripTextHtmlTags(nameFormatted, false),
          start: interval[0].value,
          end: interval[1].value,
          progress: createProgress(progress),
          dependencies: validDataResourceIdsMap[taskId] || [],
          allowedDependencies: validIds.filter(id => id !== taskId),
          barColor: shadeColor(taskColor, 0.5),
          progressColor: shadeColor(taskColor, 0.3),
          startDrag: startEditable,
          endDrag: endEditable,
          progressDrag: progressEditable && metadata.progressDataIds.length === 1,
          editable: permission && permission.writeWithView,
          textColor: contrastColor(shadeColor(taskColor, 0.5)),
          swimlanes: [...(item.swimlanes || []), ...datesSwimlanes],
          minProgress,
          maxProgress,

          metadata,
        });
      }

      return arr;
    }, []);
  }

  private isPropertyEditable(model: GanttChartBarModel): boolean {
    if (model && model.resourceType === AttributesResourceType.Collection) {
      const collection = this.collectionsMap[model.resourceId];
      return (
        collection &&
        isCollectionAttributeEditable(model.attributeId, collection, this.getPermission(model), this.query)
      );
    } else if (model && model.resourceType === AttributesResourceType.LinkType) {
      const linkType = this.linkTypesMap[model.resourceId];
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
      return this.collectionsMap[model.resourceId];
    } else if (model.resourceType === AttributesResourceType.LinkType) {
      return this.linkTypesMap[model.resourceId];
    }

    return null;
  }

  private findConstraintForModel(model: GanttChartBarModel): Constraint {
    const resource = model && this.getResource(model);
    return (resource && findAttributeConstraint(resource.attributes, model.attributeId)) || new UnknownConstraint();
  }

  private getPropertyColor(model: GanttChartBarModel): string {
    const resource = this.dataAggregator.getNextCollectionResource(model.resourceIndex);
    return resource && (<Collection>resource).color;
  }

  private requiredPropertiesAreSet(stemConfig: GanttChartStemConfig): boolean {
    return !!stemConfig.start && !!stemConfig.end;
  }

  private formatSwimlaneValue(value: any, constraint: Constraint, barModel: GanttChartBarModel): { value: any, title: string } | null {
    const overrideConstraint =
      barModel && barModel.constraint && this.formatter.checkValidConstraintOverride(constraint, barModel.constraint);

    const resultConstraint = (overrideConstraint || constraint || new UnknownConstraint());
    const formattedValue = resultConstraint.createDataValue(value, this.constraintData).format();
    if (formattedValue) {
      return {value, title: formattedValue};
    }
    return undefined;
  }

  private formatDataAggregatorValue(value: any, constraint: Constraint, data: ConstraintData, aggregatorAttribute: DataAggregatorAttribute): any {
    const ganttConstraint = aggregatorAttribute.data && (aggregatorAttribute.data as Constraint);
    const overrideConstraint = ganttConstraint && this.formatter.checkValidConstraintOverride(constraint, ganttConstraint);
    const finalConstraint = overrideConstraint || constraint || new UnknownConstraint();
    const dataValue = finalConstraint.createDataValue(value, data);

    switch (finalConstraint.type) {
      case ConstraintType.Select:
        return dataValue.serialize();
      default:
        return dataValue.format();
    }
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
    return 0;
  }

  const progressWithoutPercent = progress.toString().replace(/%*$/g, '');
  if (isNumeric(progressWithoutPercent)) {
    return Math.max(toNumber(progressWithoutPercent), 0);
  }
  return 0;
}

function createInterval(
  start: string,
  startAttributeId: string,
  startConstraint: Constraint,
  end: string,
  endAttributeId: string,
  endConstraint: Constraint
): [{ value: string; attrId: string }, { value: string; attrId: string }] {
  const startDate = parseDateTimeDataValue(start, getFormatFromConstraint(startConstraint));
  const endDate = parseDateTimeDataValue(end, getFormatFromConstraint(endConstraint));

  const startDateObj = {value: moment(startDate).format(GANTT_DATE_FORMAT), attrId: startAttributeId};
  const endDateObj = {value: moment(endDate).format(GANTT_DATE_FORMAT), attrId: endAttributeId};

  if (endDate.getTime() > startDate.getTime()) {
    return [startDateObj, endDateObj];
  }
  return [endDateObj, startDateObj];
}

function getFormatFromConstraint(constraint: Constraint): string {
  if (constraint && constraint.type === ConstraintType.DateTime) {
    const config = constraint.config as DateTimeConstraintConfig;
    return config.format;
  }
  return null;
}

export function isOnlyOneResourceConfig(config: GanttChartConfig): boolean {
  const allModels: GanttChartBarModel[] = (config.stemsConfigs || []).reduce((map, stemConfig) => {
    const models = [...(stemConfig.categories || []), stemConfig.start, stemConfig.end, stemConfig.name]
      .filter(model => isNotNullOrUndefined(model));
    map.push(...models);
    return map;
  }, []);

  const resourceIndexes = uniqueValues(allModels.map(model => model.resourceIndex));
  return resourceIndexes.length === 1;
}

function objectsMap<T extends { id?: string }>(objects: T[]): Record<string, T> {
  return (objects || []).reduce((map, object) => ({...map, [object.id]: object}), {});
}

function helperDataId(data: TaskHelperData): string {
  return [data.nameDataResource, data.startDataResource, data.endDataResource]
    .filter(resource => isNotNullOrUndefined(resource))
    .map(resource => resource.id)
    .join(':');
}
