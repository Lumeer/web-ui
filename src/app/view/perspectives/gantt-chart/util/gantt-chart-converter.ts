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
import {GanttSwimlane, GanttSwimlaneType, GanttTask} from '@lumeer/lumeer-gantt';
import * as moment from 'moment';
import {environment} from '../../../../../environments/environment';
import {COLOR_PRIMARY} from '../../../../core/constants';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
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
  objectsByIdMap,
  toNumber,
} from '../../../../shared/utils/common.utils';
import {parseDateTimeDataValue, stripTextHtmlTags} from '../../../../shared/utils/data.utils';
import {
  AggregatedDataItem,
  DataAggregator,
  DataAggregatorAttribute,
  DataResourceChain,
} from '../../../../shared/utils/data/data-aggregator';
import {shadeColor} from '../../../../shared/utils/html-modifier';
import {aggregateDataValues, DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {ColorConstraint} from '../../../../core/model/constraint/color.constraint';
import {SelectConstraint} from '../../../../core/model/constraint/select.constraint';
import {Md5} from '../../../../shared/utils/md5';
import {canCreateTaskByStemConfig, ganttModelPermissions} from './gantt-chart-util';

interface TaskHelperData {
  nameDataResource: DataResource;
  startDataResource: DataResource;
  endDataResource: DataResource;
  colorDataResources: DataResource[];
  progressDataResources: DataResource[];
  dataResourceChain: DataResourceChain[];
  swimlanesDataResources: DataResource[];
  swimlanes: GanttSwimlane[];
}

export interface GanttTaskMetadata {
  nameDataId: string;
  startDataId: string;
  endDataId: string;
  progressDataIds: string[];
  dataResourceChain: DataResourceChain[];
  swimlanesDataResourcesIds: string[];
  stemConfig: GanttChartStemConfig;
  swimlanes: GanttSwimlane[];
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

  private convertCount = 0;

  private dataAggregator = new DataAggregator((value, constraint, data, aggregatorAttribute) =>
    this.formatDataAggregatorValue(value, constraint, data, aggregatorAttribute)
  );

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
  ): {options: GanttOptions; tasks: GanttTask[]} {
    this.updateData(config, collections, documents, linkTypes, linkInstances, permissions, constraintData, query);

    const tasks = ((query && query.stems) || [])
      .reduce((allTasks, stem, index) => {
        this.dataAggregator.updateData(collections, documents, linkTypes, linkInstances, stem, constraintData);
        allTasks.push(...this.convertByStem(index));
        return allTasks;
      }, [])
      .sort((t1, t2) => this.compareTasks(t1, t2));

    const options = this.createGanttOptions(config);

    this.convertCount++;
    return {options, tasks};
  }

  private compareTasks(t1: GanttTask, t2: GanttTask): number {
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
    this.collectionsMap = objectsByIdMap(collections);
    this.documents = documents;
    this.linkTypesMap = objectsByIdMap(linkTypes);
    this.linkInstances = linkInstances;
    this.permissions = permissions;
    this.constraintData = constraintData;
    this.query = query;
  }

  private createGanttOptions(config: GanttChartConfig): GanttOptions {
    const createTasks = (config.stemsConfigs || []).some(stemConfig =>
      canCreateTaskByStemConfig(stemConfig, this.permissions, this.linkTypesMap)
    );
    return {
      swimlaneInfo: this.convertSwimlaneInfo(config),
      resizeTaskRight: true,
      resizeProgress: true,
      resizeTaskLeft: true,
      resizeSwimlanes: true,
      dragTaskSwimlanes: true,
      createTasks,
      language: environment.locale,
      lockResize: config.lockResize || false,
      padding: config.padding,
      dateFormat: GANTT_DATE_FORMAT,
      columnWidth: config.columnWidth,
      barHeight: config.barHeight,
      initialScroll: config.positionSaved && config.position && this.convertCount === 0 ? config.position.value : null,
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
      title = attribute && attribute.name;
    }
    return {
      background,
      color: COLOR_PRIMARY,
      static: isStatic,
      width,
      title,
    };
  }

  private convertByStem(index: number): GanttTask[] {
    const stemConfig = this.config && this.config.stemsConfigs && this.config.stemsConfigs[index];
    if (this.requiredPropertiesAreSet(stemConfig)) {
      return this.convertByAggregation(stemConfig, this.config.showDates);
    }
    return [];
  }

  private convertByAggregation(stemConfig: GanttChartStemConfig, showDatesAsSwimlanes: boolean): GanttTask[] {
    const aggregatorAttributes = (stemConfig.categories || [])
      .filter(property => isNotNullOrUndefined(property))
      .map(property => ({...this.convertGanttProperty(property), unique: true}));

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

    const helperData: TaskHelperData[] = [];
    this.fillByAggregationRecursive(
      stemConfig,
      aggregatedData.items,
      0,
      (stemConfig.categories || []).length,
      [],
      helperData,
      [],
      []
    );

    return this.createGanttTasksForStem(stemConfig, helperData, showDatesAsSwimlanes);
  }

  private fillByAggregationRecursive(
    stemConfig: GanttChartStemConfig,
    items: AggregatedDataItem[],
    level: number,
    maxLevel: number,
    swimlanes: GanttSwimlane[],
    helperData: TaskHelperData[],
    dataResourceChain: DataResourceChain[],
    swimlaneDataResources: DataResource[]
  ) {
    if (level === maxLevel) {
      this.fillHelperData(helperData, stemConfig, items, swimlanes, dataResourceChain, swimlaneDataResources);
      return;
    }

    const property = stemConfig.categories[level];
    const constraint = this.findConstraintForModel(property);
    for (const item of items) {
      const swimlaneValue = this.formatSwimlaneValue(item.value, constraint, property);
      this.fillByAggregationRecursive(
        stemConfig,
        item.children,
        level + 1,
        maxLevel,
        [...swimlanes, swimlaneValue],
        helperData,
        [...dataResourceChain, ...item.dataResourcesChains[0]],
        [...swimlaneDataResources, item.dataResources[0]] // we know that there is only one data resource because of unique aggregation
      );
    }
  }

  private fillHelperData(
    helperData: TaskHelperData[],
    stemConfig: GanttChartStemConfig,
    items: AggregatedDataItem[],
    swimlanes: GanttSwimlane[],
    dataResourceChain: DataResourceChain[],
    swimlanesDataResources: DataResource[]
  ) {
    const allItems = stemConfig.name
      ? items
      : [
          {
            title: null,
            dataResources: [],
            children: items,
            dataResourcesChains: [[]],
          },
        ];

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
            swimlanesDataResources,
            dataResourceChain: [...dataResourceChain, ...nameItem.dataResourcesChains[0]],
          });
        }
      }
    }
  }

  private convertGanttProperty(property: GanttChartBarModel): DataAggregatorAttribute {
    return {attributeId: property.attributeId, resourceIndex: property.resourceIndex, data: property.constraint};
  }

  private createGanttTasksForStem(
    stemConfig: GanttChartStemConfig,
    helperData: TaskHelperData[],
    showDatesAsSwimlanes: boolean
  ): GanttTask[] {
    const validTaskIds = [];
    const validDataResourceIdsMap: Record<string, string[]> = helperData.reduce((map, item) => {
      const start =
        stemConfig.start && item.startDataResource && item.startDataResource.data[stemConfig.start.attributeId];
      const end = stemConfig.end && item.endDataResource && item.endDataResource.data[stemConfig.end.attributeId];
      if (isTaskValid(start, end)) {
        const id = helperDataId(item);
        validTaskIds.push(id);
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

    const progressPermission = this.modelPermissions(stemConfig.start);
    const startPermission = this.modelPermissions(stemConfig.start);
    const endPermission = this.modelPermissions(stemConfig.start);

    const dataModel = stemConfig.start || stemConfig.name;
    const canEditDependencies = dataModel && dataModel.resourceType === AttributesResourceType.Collection;

    return helperData.reduce<GanttTask[]>((arr, item) => {
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
      const taskColor = this.parseColor(stemConfig.color, item.colorDataResources) || resourceColor;

      const datesSwimlanes: {value: any; title: string}[] = [];
      if (showDatesAsSwimlanes) {
        const startString = (this.findConstraintForModel(stemConfig.start) || new UnknownConstraint())
          .createDataValue(start, this.constraintData)
          .format();
        const endString = (this.findConstraintForModel(stemConfig.end) || new UnknownConstraint())
          .createDataValue(end, this.constraintData)
          .format();
        datesSwimlanes.push(
          ...[
            {value: startString, title: startString},
            {value: endString, title: endString},
          ]
        );
      }

      let minProgress,
        maxProgress = null;
      if (progressConstraint && progressConstraint.type === ConstraintType.Percentage) {
        const config = progressConstraint.config as PercentageConstraintConfig;
        minProgress = isNotNullOrUndefined(config.minValue) ? Math.max(0, config.minValue) : null;
        maxProgress = isNotNullOrUndefined(config.maxValue) ? config.maxValue : null;
      }

      const metadata: GanttTaskMetadata = {
        nameDataId: item.nameDataResource && item.nameDataResource.id,
        startDataId: item.startDataResource && item.startDataResource.id,
        endDataId: item.endDataResource && item.endDataResource.id,
        progressDataIds: (item.progressDataResources || []).map(dataResource => dataResource.id),
        swimlanesDataResourcesIds: (item.swimlanesDataResources || []).map(dataResource => dataResource.id),
        dataResourceChain: item.dataResourceChain,
        swimlanes: [...(item.swimlanes || [])],
        stemConfig,
      };

      const names = isArray(name) ? name : [name];
      for (let i = 0; i < names.length; i++) {
        const nameFormatted = nameConstraint.createDataValue(names[i], this.constraintData).format();

        const taskId = helperDataId(item);
        const dataResourceId = (item.nameDataResource || item.startDataResource).id;
        arr.push({
          id: taskId,
          name: stripTextHtmlTags(nameFormatted, false),
          start: interval[0].value,
          end: interval[1].value,
          progress: createProgress(progress),
          dependencies: (canEditDependencies && validDataResourceIdsMap[dataResourceId]) || [],
          allowedDependencies: canEditDependencies ? validTaskIds.filter(id => id !== taskId) : [],
          barColor: shadeColor(taskColor, 0.5),
          progressColor: shadeColor(taskColor, 0.3),
          startDrag: startEditable && startPermission.writeWithView,
          endDrag: endEditable && endPermission.writeWithView,
          progressDrag: progressEditable && metadata.progressDataIds.length === 1 && progressPermission.writeWithView,
          editable: startPermission.writeWithView && endPermission.writeWithView,
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

  private parseColor(model: GanttChartBarModel, dataResources: DataResource[]): string {
    const constraint = this.findConstraintForModel(model);
    const values = (model && (dataResources || []).map(dataResource => dataResource.data[model.attributeId])) || [];

    if (constraint.type === ConstraintType.Select) {
      for (let i = 0; i < values.length; i++) {
        const options = (<SelectConstraint>constraint).createDataValue(values[i]).options;
        if (options.length > 0 && options[0].background) {
          return options[0].background;
        }
      }
    }

    const colorConstraint = new ColorConstraint({});
    const colorDataValue = values
      .map(color => colorConstraint.createDataValue(color))
      .find(dataValue => dataValue.isValid());
    return colorDataValue && colorDataValue.format();
  }

  private isPropertyEditable(model: GanttChartBarModel): boolean {
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

  private modelPermissions(model: GanttChartBarModel): AllowedPermissions {
    if (!model) {
      return {};
    }

    return ganttModelPermissions(model, this.permissions, this.linkTypesMap);
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

  private formatSwimlaneValue(value: any, constraint: Constraint, barModel: GanttChartBarModel): GanttSwimlane | null {
    const overrideConstraint =
      barModel && barModel.constraint && this.formatter.checkValidConstraintOverride(constraint, barModel.constraint);

    const resultConstraint = overrideConstraint || constraint || new UnknownConstraint();
    const formattedValue = resultConstraint.createDataValue(value, this.constraintData).format();
    if (formattedValue) {
      if (resultConstraint.type === ConstraintType.Color) {
        return {background: formattedValue, value: formattedValue, title: ''};
      } else if (resultConstraint.type === ConstraintType.Boolean) {
        return {title: '', value: value, type: GanttSwimlaneType.Checkbox};
      }

      const textBackground = this.swimlaneBackground(value, resultConstraint);
      const textColor = textBackground && contrastColor(textBackground);
      return {
        value,
        title: formattedValue,
        textBackground,
        textColor,
        avatarUrl: this.swimlaneAvatarUrl(value, resultConstraint),
      };
    }
    return {value: '', title: ''};
  }

  private swimlaneBackground(value: any, constraint: Constraint): string {
    if (constraint.type === ConstraintType.Select) {
      const options = (<SelectConstraint>constraint).createDataValue(value).options;
      return options && options[0] && options[0].background;
    }
    return null;
  }

  private swimlaneAvatarUrl(value: any, constraint: Constraint): string {
    if (constraint.type === ConstraintType.User && isNotNullOrUndefined(value)) {
      const md5hash = Md5.hashStr(String(value || ''));
      return `https://www.gravatar.com/avatar/${md5hash}?r=g&d=retro`;
    }

    return null;
  }

  private formatDataAggregatorValue(
    value: any,
    constraint: Constraint,
    data: ConstraintData,
    aggregatorAttribute: DataAggregatorAttribute
  ): any {
    const ganttConstraint = aggregatorAttribute.data && (aggregatorAttribute.data as Constraint);
    const overrideConstraint =
      ganttConstraint && this.formatter.checkValidConstraintOverride(constraint, ganttConstraint);
    const finalConstraint = overrideConstraint || constraint || new UnknownConstraint();
    const dataValue = finalConstraint.createDataValue(value, data);

    switch (finalConstraint.type) {
      case ConstraintType.Select:
      case ConstraintType.User:
      case ConstraintType.Boolean:
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
): [{value: string; attrId: string}, {value: string; attrId: string}] {
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

function helperDataId(data: TaskHelperData): string {
  return [data.nameDataResource, data.startDataResource, data.endDataResource]
    .filter(resource => isNotNullOrUndefined(resource))
    .map(resource => resource.id)
    .join(':');
}
