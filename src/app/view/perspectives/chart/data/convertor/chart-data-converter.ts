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

import {Attribute, Collection} from '../../../../../core/store/collections/collection';
import {DocumentData, DocumentModel} from '../../../../../core/store/documents/document.model';
import {
  ChartAggregation,
  ChartAxis,
  ChartAxisResourceType,
  chartAxisResourceTypesMap,
  ChartAxisType,
  ChartConfig,
  ChartSortType,
  ChartType,
} from '../../../../../core/store/charts/chart';
import {isNotNullOrUndefined, isNullOrUndefined, isNumeric, toNumber} from '../../../../../shared/utils/common.utils';
import {Injectable} from '@angular/core';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../../core/store/link-instances/link.instance';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../core/store/navigation/query';
import {
  ChartAxisCategory,
  ChartData,
  ChartDataSet,
  ChartPoint,
  ChartYAxisType,
  convertChartDateFormat,
} from './chart-data';
import {getOtherLinkedCollectionId} from '../../../../../shared/utils/link-type.utils';
import {hex2rgba} from '../../../../../shared/utils/html-modifier';
import {
  convertToBig,
  decimalUserToStore,
  formatDataValue,
  formatPercentageDataValue,
  parseMomentDate,
} from '../../../../../shared/utils/data.utils';
import {compareDataValues} from '../../../../../shared/utils/data/data-compare.utils';
import {
  Constraint,
  ConstraintType,
  DateTimeConstraintConfig,
  PercentageConstraintConfig,
} from '../../../../../core/model/data/constraint';
import {
  findAttributeConstraint,
  isCollectionAttributeEditable,
  isLinkTypeAttributeEditable,
} from '../../../../../core/store/collections/collection.util';
import Big from 'big.js';
import {mergePermissions} from '../../../../../shared/utils/resource.utils';
import {resetUnusedMomentPart} from '../../../../../shared/utils/date.utils';

// Document or LinkInstance
interface ObjectData {
  id: string;
  data: DocumentData;
  resourceId: string;
}

interface ObjectDataWithLinks extends ObjectData {
  from: ObjectData[];
  to: ObjectData[];
}

// Collection or LinkType
interface AxisResource {
  id: string;
  attributes: Attribute[];
  color: string;
}

interface AxisResourceChain {
  resource: AxisResource;
  index: number;
  attributeId?: string;
  asIdOfArray?: boolean;
  asIdOfObject?: boolean;
}

type ObjectDataMap = Record<string, Record<string, ObjectDataWithLinks>>;
/*
 * Structure of data is:
 *  {key1: {key2 .... : {keyN: [{value: any, id: string}]} ... } where key is used for group data and array for data aggregation
 *  if dataset name is set then N = 2; else N = 1
 */
type DataMap = Record<string, any>;

@Injectable()
export class ChartDataConverter {
  private collections: Collection[];
  private documents: DocumentModel[];
  private linkTypes: LinkType[];
  private linkInstances: LinkInstance[];
  private permissions: Record<string, AllowedPermissions>;
  private query: Query;

  private currentConfig: ChartConfig;
  private y1Sets: ChartDataSet[];
  private y2Sets: ChartDataSet[];

  public updateData(
    collections: Collection[],
    documents: DocumentModel[],
    permissions: Record<string, AllowedPermissions>,
    query: Query,
    linkTypes?: LinkType[],
    linkInstances?: LinkInstance[]
  ) {
    this.collections = collections;
    this.documents = documents;
    this.linkTypes = linkTypes;
    this.linkInstances = linkInstances;
    this.permissions = permissions;
    this.query = query;
  }

  public convertType(type: ChartType): ChartData {
    if (this.areSetsEmpty()) {
      return this.createEmptyData({...this.currentConfig, type});
    }

    this.currentConfig = {...this.currentConfig, type};
    return {
      type,
      sets: [...(this.y1Sets || []), ...(this.y2Sets || [])],
    };
  }

  private areSetsEmpty(): boolean {
    return (!this.y1Sets || this.y1Sets.length === 0) && (!this.y2Sets || this.y2Sets.length === 0);
  }

  public convert(config: ChartConfig): ChartData {
    const xAxis = config.axes[ChartAxisType.X];
    const y1Axis = config.axes[ChartAxisType.Y1];
    const y2Axis = config.axes[ChartAxisType.Y2];

    if (!xAxis && !y1Axis && !y2Axis) {
      return this.createEmptyData(config);
    }

    const axisResourcesOrder = createAxisResourceOrder(this.query, this.collections, this.linkTypes);
    const dataMap = this.createDataMap(axisResourcesOrder);

    if (y1Axis && y2Axis) {
      this.y1Sets = this.convertAxis(config, ChartAxisType.Y1, dataMap, axisResourcesOrder);
      this.y2Sets = this.convertAxis(config, ChartAxisType.Y2, dataMap, axisResourcesOrder);
      this.currentConfig = config;
      return this.convertType(config.type);
    } else if (!y2Axis && (xAxis || y1Axis)) {
      this.y1Sets = this.convertAxis(config, ChartAxisType.Y1, dataMap, axisResourcesOrder);
      this.y2Sets = [];
      this.currentConfig = config;
      return this.convertType(config.type);
    } else if (xAxis || y2Axis) {
      this.y1Sets = [];
      this.y2Sets = this.convertAxis(config, ChartAxisType.Y2, dataMap, axisResourcesOrder);
      this.currentConfig = config;
      return this.convertType(config.type);
    }

    return this.createEmptyData(config);
  }

  private createDataMap(axisResourcesOrder: AxisResource[]): ObjectDataMap {
    const idsOrderMap = axisResourcesOrder.reduce(
      (idsMap, axisResource, index) => ({...idsMap, [axisResource.id]: index}),
      {}
    );
    const linkTypeIds = new Set((this.linkTypes || []).map(lt => lt.id));
    const allDocumentsMap: Record<string, DocumentModel> = {};
    const map: ObjectDataMap = {};

    for (const document of this.documents) {
      allDocumentsMap[document.id] = document;
      const resourceId = collectionAxisResourceId(document.collectionId);
      !map[resourceId] && (map[resourceId] = {});
      map[resourceId][document.id] = {
        id: document.id,
        data: document.data,
        resourceId,
        to: [],
        from: [],
      };
    }

    for (const linkInstance of this.linkInstances || []) {
      const resourceId = linkAxisResourceId(linkInstance.linkTypeId);
      !map[resourceId] && (map[resourceId] = {});
      map[resourceId][linkInstance.id] = {
        id: linkInstance.id,
        data: linkInstance.data,
        resourceId,
        to: [],
        from: [],
      };

      const document1 = allDocumentsMap[linkInstance.documentIds[0]];
      const document2 = allDocumentsMap[linkInstance.documentIds[1]];

      const document1Map = document1 && map[collectionAxisResourceId(document1.collectionId)];
      const document2Map = document2 && map[collectionAxisResourceId(document2.collectionId)];
      const linkInstanceMap = map[resourceId];

      if (!document1 || !document1Map || !document2 || !document2Map || !linkTypeIds.has(linkInstance.linkTypeId)) {
        continue;
      }

      const document1CollectionIndex = idsOrderMap[collectionAxisResourceId(document1.collectionId)];
      const document2CollectionIndex = idsOrderMap[collectionAxisResourceId(document2.collectionId)];
      const linkInstanceObjectData = {
        id: linkInstance.id,
        data: linkInstance.data,
        resourceId: linkAxisResourceId(linkInstance.linkTypeId),
      };
      const document1ObjectData = {
        id: document1.id,
        data: document1.data,
        resourceId: collectionAxisResourceId(document1.collectionId),
      };
      const document2ObjectData = {
        id: document2.id,
        data: document2.data,
        resourceId: collectionAxisResourceId(document2.collectionId),
      };

      if (document1CollectionIndex <= document2CollectionIndex) {
        document1Map[document1.id].to.push(linkInstanceObjectData);
        document2Map[document2.id].from.push(linkInstanceObjectData);
        linkInstanceMap[linkInstance.id].to.push(document2ObjectData);
        linkInstanceMap[linkInstance.id].from.push(document1ObjectData);
      } else {
        document2Map[document2.id].to.push(linkInstanceObjectData);
        document1Map[document1.id].from.push(linkInstanceObjectData);
        linkInstanceMap[linkInstance.id].to.push(document1ObjectData);
        linkInstanceMap[linkInstance.id].from.push(document2ObjectData);
      }
    }

    return map;
  }

  private convertAxis(
    config: ChartConfig,
    yAxisType: ChartYAxisType,
    dataMap: ObjectDataMap,
    axisResourcesOrder: AxisResource[]
  ): ChartDataSet[] {
    const xAxis = config.axes[ChartAxisType.X];
    const yAxis = config.axes[yAxisType];
    const yName = config.names && config.names[yAxisType];

    if (this.areChartAxesThroughLink(xAxis, yAxis, yName)) {
      const chain = this.createAxisResourceChain(axisResourcesOrder, xAxis, yAxis, yName);
      const data = this.iterate(chain, dataMap, config);
      return this.convertDocumentsMapData(data, config, axisResourcesOrder[yAxis.resourceIndex], yAxisType);
    }

    return this.convertSingleAxis(yAxisType, config, dataMap, axisResourcesOrder, xAxis, yAxis);
  }

  private areChartAxesThroughLink(xAxis?: ChartAxis, yAxis?: ChartAxis, yName?: ChartAxis): boolean {
    const y1CollectionIndexes = new Set(
      [
        xAxis && xAxis.resourceIndex,
        yAxis && yAxis.resourceIndex,
        xAxis && yAxis && yName && yName.resourceIndex,
      ].filter(index => isNotNullOrUndefined(index))
    );
    return y1CollectionIndexes.size > 1;
  }

  private createAxisResourceChain(
    axisResourcesOrder: AxisResource[],
    xAxis: ChartAxis,
    yAxis: ChartAxis,
    yName?: ChartAxis
  ): AxisResourceChain[] {
    let index = xAxis.resourceIndex;
    const chain: AxisResourceChain[] = [
      {
        resource: axisResourcesOrder[xAxis.resourceIndex],
        index: xAxis.resourceIndex,
        attributeId: xAxis.attributeId,
        asIdOfArray: !yName,
        asIdOfObject: !!yName,
      },
    ];

    if (yName) {
      const nameSubChain = this.createAxisResourceChainForRange(
        axisResourcesOrder,
        xAxis.resourceIndex,
        yName.resourceIndex
      );
      chain.push(...nameSubChain);

      chain.push({
        index: yName.resourceIndex,
        resource: axisResourcesOrder[yName.resourceIndex],
        attributeId: yName.attributeId,
        asIdOfArray: true,
      });
      index = yName.resourceIndex;
    }

    const axisSubChain = this.createAxisResourceChainForRange(axisResourcesOrder, index, yAxis.resourceIndex);
    chain.push(...axisSubChain);

    chain.push({
      index: yAxis.resourceIndex,
      resource: axisResourcesOrder[yAxis.resourceIndex],
      attributeId: yAxis.attributeId,
    });

    return chain;
  }

  private createAxisResourceChainForRange(
    axisResourcesOrder: AxisResource[],
    startIndex: number,
    endIndex: number
  ): AxisResourceChain[] {
    const chain: AxisResourceChain[] = [];
    if (startIndex > endIndex) {
      for (let i = startIndex - 1; i > endIndex; i--) {
        chain.push({index: i, resource: axisResourcesOrder[i]});
      }
    } else {
      for (let i = startIndex + 1; i < endIndex; i++) {
        chain.push({index: i, resource: axisResourcesOrder[i]});
      }
    }
    return chain;
  }

  private iterate(chain: AxisResourceChain[], dataMap: ObjectDataMap, config: ChartConfig): DataMap {
    const dataObjects = Object.values(dataMap[chain[0].resource.id] || {});
    const sortedDataObjects = this.sortDataObjects(dataObjects, config);
    const data = {};
    this.iterateRecursive(sortedDataObjects, data, chain, 0, dataMap);
    return data;
  }

  private sortDataObjects(dataObjects: ObjectDataWithLinks[], config: ChartConfig): ObjectDataWithLinks[] {
    const sort = config.sort;
    const xAxis = config.axes[ChartAxisType.X];
    const sortAxis = (sort && sort.axis) || xAxis;
    if (
      !dataObjects ||
      dataObjects.length === 0 ||
      !sort ||
      !sortAxis ||
      dataObjects[0].resourceId !== axisResourceId(sortAxis.axisResourceType, sortAxis.resourceId)
    ) {
      return dataObjects || [];
    }

    const asc = sort.type === ChartSortType.Ascending;
    const attribute = this.findAttributeByAxis(sortAxis);
    return dataObjects.sort((a, b) =>
      compareDataValues(
        a.data[sortAxis.attributeId],
        b.data[sortAxis.attributeId],
        attribute && attribute.constraint,
        asc
      )
    );
  }

  private findAttributeByAxis(axis: ChartAxis): Attribute {
    if (axis.axisResourceType === ChartAxisResourceType.Collection) {
      const collection = (this.collections || []).find(c => c.id === axis.resourceId);
      return ((collection && collection.attributes) || []).find(attribute => attribute.id === axis.attributeId);
    } else if (axis.axisResourceType === ChartAxisResourceType.LinkType) {
      const linkType = (this.linkTypes || []).find(c => c.id === axis.resourceId);
      return ((linkType && linkType.attributes) || []).find(attribute => attribute.id === axis.attributeId);
    }

    return null;
  }

  private iterateRecursive(
    objectData: ObjectDataWithLinks[],
    data: DataMap,
    chain: AxisResourceChain[],
    index: number,
    dataMap: ObjectDataMap
  ) {
    const stage = chain[index];
    if (index === chain.length - 1) {
      const values = objectData
        .map(d => ({id: d.id, value: d.data[stage.attributeId]}))
        .filter(obj => isNotNullOrUndefined(obj.value));
      data.push(...values);
      return;
    }
    const nextStage = chain[index + 1];
    const forward = nextStage.index < stage.index;
    const constraint = findAttributeConstraint(stage.resource && stage.resource.attributes, stage.attributeId);

    for (const object of objectData) {
      const linkedObjectData = forward ? object.from : object.to;
      const nextStageObjectData = dataMap[nextStage.resource.id] || {};

      const linkedObjectDataWithLinks = linkedObjectData
        .filter(d => d.resourceId === nextStage.resource.id)
        .map(d => nextStageObjectData[d.id]);

      if (stage.asIdOfArray || stage.asIdOfObject) {
        const values = this.getValues(object, stage.attributeId);
        if (values.length === 0) {
          continue;
        }

        for (const value of values) {
          const formattedValue = this.formatChartValue(value, constraint);
          if (!data[formattedValue]) {
            data[formattedValue] = stage.asIdOfArray ? [] : {};
          }
          this.iterateRecursive(linkedObjectDataWithLinks, data[value], chain, index + 1, dataMap);
        }
      } else {
        this.iterateRecursive(linkedObjectDataWithLinks, data, chain, index + 1, dataMap);
      }
    }
  }

  private getValues(object: ObjectData, attributeId: string): any[] {
    const value = object.data[attributeId];
    if (!value) {
      return [];
    }

    return Array.isArray(value) ? value : [value];
  }

  private convertDocumentsMapData(
    data: DataMap,
    config: ChartConfig,
    axisResource: AxisResource,
    yAxisType: ChartYAxisType
  ): ChartDataSet[] {
    const xEntries = Object.keys(data);
    if (xEntries.length === 0) {
      return [];
    }

    if (areDataNested(data, xEntries)) {
      return this.convertDocumentsMapDataNested(data, xEntries, config, axisResource, yAxisType);
    }

    return this.convertDocumentsMapDataSimple(data, xEntries, config, axisResource, yAxisType);
  }

  private convertDocumentsMapDataNested(
    data: DataMap,
    xEntries: string[],
    config: ChartConfig,
    axisResource: AxisResource,
    yAxisType: ChartYAxisType
  ): ChartDataSet[] {
    const isNumericMap: Record<string, boolean> = {};
    const pointsMap: Record<string, ChartPoint[]> = {};
    let draggable = false;
    const canDragAxis = this.canDragAxis(config, yAxisType);

    const xAxis = config.axes[ChartAxisType.X];
    const xConstraint = this.axisConstraint(xAxis);

    const yAxis = config.axes[yAxisType];
    const yConstraint = this.axisConstraint(yAxis);

    for (const key of xEntries) {
      const nestedValue: Record<string, {id: string; value: any}[]> = data[key];
      const nestedKeys = Object.keys(nestedValue);
      for (const nestedKey of nestedKeys) {
        if (!pointsMap[nestedKey]) {
          pointsMap[nestedKey] = [];
          isNumericMap[nestedKey] = true;
        }

        const valueObjects: {id: string; value: any}[] = nestedValue[nestedKey].filter(
          obj => obj.value !== '' && isNotNullOrUndefined(obj.value)
        );
        const values = valueObjects.map(obj => obj.value);
        let yValue = aggregate(config.aggregations && config.aggregations[yAxisType], values, yConstraint);
        if (isNotNullOrUndefined(yValue)) {
          const id = canDragAxis && valueObjects.length === 1 ? valueObjects[0].id : null;
          yValue = this.formatChartValue(yValue, yConstraint);
          const isNum = isNumeric(yValue);

          isNumericMap[nestedKey] = isNumericMap[nestedKey] && isNum;
          pointsMap[nestedKey].push({id, x: key, y: yValue});
          draggable = draggable || isNotNullOrUndefined(id);
        }
      }
    }

    const sets: ChartDataSet[] = [];
    const legendEntriesNames = Object.keys(pointsMap);
    let colorAlpha = 100;
    const colorAlphaStep = 70 / Math.max(1, legendEntriesNames.length - 1); // min alpha is 30

    for (let i = 0; i < legendEntriesNames.length; i++) {
      const name = legendEntriesNames[i];
      const color = hex2rgba(axisResource.color, colorAlpha / 100);
      sets.push({
        id: this.yAxisCollectionId(config, yAxisType),
        points: pointsMap[name],
        color,
        name,
        yAxis: {
          category: this.getAxisCategory(isNumericMap[name], yConstraint),
          config: yConstraint && yConstraint.config,
        },
        xAxis: {
          category: this.getAxisCategory(false, xConstraint),
          config: xConstraint && xConstraint.config,
        },
        yAxisType,
        draggable,
        resourceType: axisResourceTypeFromResourceId(axisResource.id),
      });
      colorAlpha -= colorAlphaStep;
    }

    return sets;
  }

  private axisConstraint(axis: ChartAxis): Constraint {
    if (axis.axisResourceType === ChartAxisResourceType.Collection) {
      const collection = (this.collections || []).find(coll => coll.id === axis.resourceId);
      return collection && findAttributeConstraint(collection.attributes, axis.attributeId);
    } else if (axis.axisResourceType === ChartAxisResourceType.LinkType) {
      const linkType = (this.linkTypes || []).find(lt => lt.id === axis.resourceId);
      return linkType && findAttributeConstraint(linkType.attributes, axis.attributeId);
    }
    return null;
  }

  private formatChartValue(value: any, constraint: Constraint): any {
    if (!constraint) {
      return formatDataValue(value);
    }

    switch (constraint.type) {
      case ConstraintType.DateTime:
        return this.formatDateTimeValue(value, constraint.config as DateTimeConstraintConfig);
      case ConstraintType.Percentage:
        return this.formatPercentageValue(value, constraint.config as PercentageConstraintConfig);
      default:
        return formatDataValue(value, constraint);
    }
  }

  private formatDateTimeValue(value: any, config: DateTimeConstraintConfig): string {
    const format = config && config.format;
    const momentDate = parseMomentDate(value, format);
    const resetDate = resetUnusedMomentPart(momentDate, format);
    return resetDate.format(convertChartDateFormat(format));
  }

  private formatPercentageValue(value: any, config: PercentageConstraintConfig): string {
    const percentageValue = formatPercentageDataValue(value, config);
    return decimalUserToStore(percentageValue);
  }

  private getAxisCategory(numeric: boolean, constraint: Constraint): ChartAxisCategory {
    if (!constraint) {
      return numeric ? ChartAxisCategory.Number : ChartAxisCategory.Text;
    }

    switch (constraint.type) {
      case ConstraintType.DateTime:
        return ChartAxisCategory.Date;
      case ConstraintType.Number:
        return ChartAxisCategory.Number;
      case ConstraintType.Percentage:
        return ChartAxisCategory.Percentage;
      default:
        return numeric ? ChartAxisCategory.Number : ChartAxisCategory.Text;
    }
  }

  private convertSingleAxis(
    yAxisType: ChartYAxisType,
    config: ChartConfig,
    dataMap: ObjectDataMap,
    axisResourcesOrder: AxisResource[],
    xAxis: ChartAxis,
    yAxis: ChartAxis
  ): ChartDataSet[] {
    let resourceId: string;
    let axisResource: AxisResource;
    if (yAxis) {
      resourceId = axisResourceId(yAxis.axisResourceType, yAxis.resourceId);
      axisResource = axisResourcesOrder[yAxis.resourceIndex];
    } else {
      resourceId = axisResourceId(xAxis.axisResourceType, xAxis.resourceId);
      axisResource = axisResourcesOrder[xAxis.resourceIndex];
    }

    const documents = Object.values(dataMap[resourceId] || {});
    const sortedDataObjects = this.sortDataObjects(documents, config);

    if (!xAxis || !yAxis) {
      return this.convertSingleAxisSimple(yAxisType, config, sortedDataObjects, axisResource, xAxis, yAxis);
    }
    return this.convertSingleAxisWithAggregation(yAxisType, config, sortedDataObjects, axisResource, xAxis, yAxis);
  }

  private convertSingleAxisSimple(
    yAxisType: ChartYAxisType,
    config: ChartConfig,
    dataObjects: ObjectData[],
    axisResource: AxisResource,
    xAxis: ChartAxis,
    yAxis: ChartAxis
  ): ChartDataSet[] {
    let isNum = true;
    const actualValues = new Set();
    const draggable = this.canDragAxis(config, yAxisType);
    const points: ChartPoint[] = [];

    const definedAxis = yAxis || xAxis;
    const constraint = findAttributeConstraint(axisResource.attributes, definedAxis.attributeId);

    for (const dataObject of dataObjects) {
      let xValue = xAxis && dataObject.data[xAxis.attributeId];
      let yValue = yAxis && dataObject.data[yAxis.attributeId];
      if (isNullOrUndefined(xValue || yValue)) {
        continue;
      }

      // we know that x or y is set
      if (isNotNullOrUndefined(xValue || yValue) && actualValues.has(xValue || yValue)) {
        continue;
      }

      const id = draggable ? dataObject.id : null;

      if (isNotNullOrUndefined(xValue)) {
        xValue = this.formatChartValue(xValue, constraint);
      }
      if (isNotNullOrUndefined(yValue)) {
        yValue = this.formatChartValue(yValue, constraint);
      }
      isNum = isNum && isNumeric(xValue || yValue);

      points.push({id, x: xValue, y: yValue});
      actualValues.add(xValue || yValue);
    }

    const name = this.getAttributeNameForAxis(yAxis, axisResource);

    const axis = {
      category: this.getAxisCategory(isNum, constraint),
      config: constraint && constraint.config,
    };

    const dataSet: ChartDataSet = {
      id: (yAxis && yAxis.attributeId) || null,
      points,
      color: axisResource.color,
      yAxis: yAxis && axis,
      xAxis: xAxis && axis,
      yAxisType,
      name,
      draggable,
      resourceType: axisResourceTypeFromResourceId(axisResource.id),
    };
    return [dataSet];
  }

  private canDragAxis(config: ChartConfig, yAxisType: ChartYAxisType): boolean {
    const yAxis = config.axes[yAxisType];
    if (!yAxis) {
      return false;
    }

    if (yAxis.axisResourceType === ChartAxisResourceType.Collection) {
      return this.canDragCollectionAxis(yAxis.resourceId, yAxis.attributeId);
    } else if (yAxis.axisResourceType === ChartAxisResourceType.LinkType) {
      return this.canDragLinkAxis(yAxis.resourceId, yAxis.attributeId);
    }

    return false;
  }

  private canDragCollectionAxis(collectionId: string, attributeId: string): boolean {
    const permission = this.permissions && this.permissions[collectionId];
    if (!permission || !permission.writeWithView) {
      return false;
    }

    const collection = this.collections && this.collections.find(c => c.id === collectionId);
    return isCollectionAttributeEditable(attributeId, collection, this.permissions[collectionId] || {}, this.query);
  }

  private canDragLinkAxis(linkTypeId: string, attributeId: string): boolean {
    const linkType = this.linkTypes && this.linkTypes.find(lt => lt.id === linkTypeId);
    if (!linkType) {
      return false;
    }

    const permission1 = this.permissions && this.permissions[linkType.collectionIds[0]];
    const permission2 = this.permissions && this.permissions[linkType.collectionIds[1]];
    if (!permission1 || !permission2 || !permission1.writeWithView || !permission2.writeWithView) {
      return false;
    }

    const mergedPermissions = mergePermissions(permission1, permission2);

    return isLinkTypeAttributeEditable(attributeId, linkType, mergedPermissions, this.query);
  }

  private getAttributeNameForAxis(axis: ChartAxis, axisResource: AxisResource): string {
    const attribute =
      axis && axisResource && (axisResource.attributes || []).find(attr => attr.id === axis.attributeId);
    return attribute && attribute.name;
  }

  private convertSingleAxisWithAggregation(
    yAxisType: ChartYAxisType,
    config: ChartConfig,
    dataObjects: ObjectData[],
    axisResource: AxisResource,
    xAxis?: ChartAxis,
    yAxis?: ChartAxis
  ): ChartDataSet[] {
    const data: DataMap = {};
    for (const dataObject of dataObjects) {
      const xConstraint = findAttributeConstraint(axisResource.attributes, xAxis && xAxis.attributeId);
      const xValue = this.formatChartValue(dataObject.data[xAxis.attributeId], xConstraint);

      const yValue = dataObject.data[yAxis.attributeId];
      if (isNullOrUndefined(xValue) || isNullOrUndefined(yValue)) {
        continue;
      }
      if (!data[xValue]) {
        data[xValue] = [];
      }
      data[xValue].push({id: dataObject.id, value: yValue});
    }

    return this.convertDocumentsMapDataSimple(data, Object.keys(data), config, axisResource, yAxisType);
  }

  private convertDocumentsMapDataSimple(
    data: DataMap,
    xEntries: string[],
    config: ChartConfig,
    axisResource: AxisResource,
    yAxisType: ChartYAxisType
  ): ChartDataSet[] {
    let isNum = true;
    let draggable = false;
    const canDragAxis = this.canDragAxis(config, yAxisType);
    const points: ChartPoint[] = [];

    const xAxis = config.axes[ChartAxisType.X];
    const xConstraint = this.axisConstraint(xAxis);

    const yAxis = config.axes[yAxisType];
    const yConstraint = this.axisConstraint(yAxis);

    for (const key of xEntries) {
      const valueObjects: {id: string; value: any}[] = data[key].filter(
        obj => obj.value !== '' && isNotNullOrUndefined(obj.value)
      );
      const values = valueObjects.map(obj => obj.value);

      let yValue = aggregate(config.aggregations && config.aggregations[yAxisType], values, yConstraint);
      if (isNotNullOrUndefined(yValue)) {
        const id = canDragAxis && valueObjects.length === 1 ? valueObjects[0].id : null;
        yValue = this.formatChartValue(yValue, yConstraint);
        isNum = isNum && isNumeric(yValue);

        points.push({id, x: key, y: yValue});
        draggable = draggable || isNotNullOrUndefined(id);
      }
    }

    const name = this.getAttributeNameForAxis(yAxis, axisResource);

    const dataSet = {
      id: this.yAxisCollectionId(config, yAxisType),
      points,
      color: axisResource && axisResource.color,
      yAxis: {
        category: this.getAxisCategory(isNum, yConstraint),
        config: yConstraint && yConstraint.config,
      },
      xAxis: {
        category: this.getAxisCategory(false, xConstraint),
        config: xConstraint && xConstraint.config,
      },
      yAxisType,
      name,
      draggable,
      resourceType: axisResource && axisResourceTypeFromResourceId(axisResource.id),
    };
    return [dataSet];
  }

  private yAxisCollectionId(config: ChartConfig, yAxisType: ChartYAxisType): string {
    const yAxis = config.axes[yAxisType];
    return (yAxis && yAxis.attributeId) || null;
  }

  public convertAxisType(config: ChartConfig, type: ChartYAxisType): ChartData {
    const axisResourcesOrder = createAxisResourceOrder(this.query, this.collections, this.linkTypes);
    const dataMap = this.createDataMap(axisResourcesOrder);

    const xAxis = config.axes[ChartAxisType.X];
    const yAxis = config.axes[type];

    const otherSets = type === ChartAxisType.Y1 ? this.y2Sets : this.y1Sets;
    const otherSetsAreEmpty = !otherSets || otherSets.length === 0;

    const sets =
      ((yAxis || (xAxis && otherSetsAreEmpty)) && this.convertAxis(config, type, dataMap, axisResourcesOrder)) || [];
    if (type === ChartAxisType.Y1) {
      this.y1Sets = sets;
    } else {
      this.y2Sets = sets;
    }

    const otherYAxis = config.axes[type === ChartAxisType.Y1 ? ChartAxisType.Y2 : ChartAxisType.Y1];
    sets.length > 0 && !otherYAxis && this.clearOtherSetsByType(type);

    this.currentConfig = config;
    return this.convertType(config.type);
  }

  private clearOtherSetsByType(type: ChartAxisType) {
    if (type === ChartAxisType.Y1) {
      this.y2Sets = [];
    } else {
      this.y1Sets = [];
    }
  }

  private createEmptyData(config: ChartConfig): ChartData {
    const color = this.collections && this.collections[0] && this.collections[0].color;
    const emptySet: ChartDataSet = {
      yAxisType: ChartAxisType.Y1,
      yAxis: {
        category: ChartAxisCategory.Number,
      },
      name: '',
      draggable: false,
      points: [],
      id: null,
      resourceType: ChartAxisResourceType.Collection,
      color,
    };

    this.y1Sets = [emptySet];
    this.y2Sets = [];
    this.currentConfig = config;
    return {sets: [emptySet], type: config.type};
  }
}

function createAxisResourceOrder(query: Query, collections: Collection[], linkTypes: LinkType[]): AxisResource[] {
  const stem = query.stems[0];
  const baseCollection = collections.find(collection => collection.id === stem.collectionId);
  const chain: AxisResource[] = [
    {
      id: collectionAxisResourceId(baseCollection.id),
      attributes: baseCollection.attributes,
      color: baseCollection.color,
    },
  ];
  let previousCollectionId = baseCollection.id;
  for (let i = 0; i < (stem.linkTypeIds || []).length; i++) {
    const linkType = linkTypes.find(lt => lt.id === stem.linkTypeIds[i]);
    const otherCollectionId = getOtherLinkedCollectionId(linkType, previousCollectionId);
    const otherCollection = collections.find(collection => collection.id === otherCollectionId);

    if (otherCollection && linkType) {
      chain.push({id: linkAxisResourceId(linkType.id), attributes: linkType.attributes, color: otherCollection.color});
      chain.push({
        id: collectionAxisResourceId(otherCollection.id),
        attributes: otherCollection.attributes,
        color: otherCollection.color,
      });
      previousCollectionId = otherCollection.id;
    } else {
      break;
    }
  }

  return chain;
}

function axisResourceTypeFromResourceId(resourceId: string): ChartAxisResourceType {
  const [type] = resourceId.split(':', 2);
  return chartAxisResourceTypesMap[type];
}

function collectionAxisResourceId(id: string): string {
  return axisResourceId(ChartAxisResourceType.Collection, id);
}

function linkAxisResourceId(id: string): string {
  return axisResourceId(ChartAxisResourceType.LinkType, id);
}

function axisResourceId(type: ChartAxisResourceType, id: string): string {
  return `${type}:${id}`;
}

function areDataNested(data: DataMap, keys: string[]): boolean {
  const value = data[keys[0]];
  return !Array.isArray(value);
}

function aggregate(aggregation: ChartAggregation, values: any[], constraint: Constraint): any {
  if (values.length === 1) {
    return values[0];
  }

  switch (aggregation) {
    case ChartAggregation.Sum:
      return sumValues(values, constraint);
    case ChartAggregation.Avg:
      return avgValues(values, constraint);
    case ChartAggregation.Min:
      return minInValues(values, constraint);
    case ChartAggregation.Max:
      return maxInValues(values, constraint);
    default:
      return sumAnyValues(values);
  }
}

function sumValues(values: any[], constraint: Constraint): any {
  if (!constraint) {
    return sumAnyValues(values);
  }

  switch (constraint.type) {
    case ConstraintType.Number:
    case ConstraintType.Percentage:
      return sumNumericValues(values);
    default:
      return sumAnyValues(values);
  }
}

function sumNumericValues(values: any[]): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return values[0];
  }

  return bigValues.reduce((sum, val) => sum.add(val), new Big(0)).toFixed();
}

function transformToBigValues(values: any[]): Big[] {
  return values.map(value => convertToBig(value)).filter(value => !!value);
}

function sumAnyValues(values: any[]): any {
  const numericValues = values.filter(value => isNumeric(value));
  if (numericValues.length === 0) {
    return values[0];
  }

  return numericValues.reduce((sum, value) => sum + toNumber(value), 0);
}

function avgValues(values: any[], constraint: Constraint): any {
  if (!constraint) {
    return avgAnyValues(values);
  }

  switch (constraint.type) {
    case ConstraintType.Number:
    case ConstraintType.Percentage:
      return avgNumericValues(values);
    default:
      return avgAnyValues(values);
  }
}

function avgNumericValues(values: any[]): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return values[0];
  }

  return bigValues
    .reduce((sum, val) => sum.add(val), new Big(0))
    .div(values.length)
    .toFixed();
}

function avgAnyValues(values: any[]): any {
  const numericValues = values.filter(value => isNumeric(value));
  if (numericValues.length === 0) {
    return values[0];
  }

  return numericValues.reduce((sum, value) => sum + toNumber(value), 0) / numericValues.length;
}

function minInValues(values: any[], constraint: Constraint): any {
  if (!constraint) {
    return minInAnyValues(values);
  }

  switch (constraint.type) {
    case ConstraintType.Number:
    case ConstraintType.Percentage:
      return minInNumericValues(values);
    default:
      return minInAnyValues(values);
  }
}

function minInNumericValues(values: any[]): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return values[0];
  }

  return bigValues.sort((a, b) => a.cmp(b))[0].toFixed();
}

function minInAnyValues(values: any[]): any {
  const sortedValues = values.sort((a, b) => (a > b ? 1 : -1));
  return sortedValues[0];
}

function maxInValues(values: any[], constraint: Constraint): any {
  if (!constraint) {
    return maxInAnyValues(values);
  }

  switch (constraint.type) {
    case ConstraintType.Number:
    case ConstraintType.Percentage:
      return maxInNumericValues(values);
    default:
      return maxInAnyValues(values);
  }
}

function maxInNumericValues(values: any[]): any {
  const bigValues = transformToBigValues(values);
  if (bigValues.length === 0) {
    return values[0];
  }

  return bigValues.sort((a, b) => -1 * a.cmp(b))[0].toFixed();
}

function maxInAnyValues(values: any[]): any {
  const sortedValues = values.sort((a, b) => (a > b ? -1 : 1));
  return sortedValues[0];
}
