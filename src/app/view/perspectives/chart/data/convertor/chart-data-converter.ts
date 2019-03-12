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
  ChartSort,
  ChartSortType,
  ChartType,
} from '../../../../../core/store/charts/chart';
import {isNotNullOrUndefind, isNullOrUndefined, isNumeric} from '../../../../../shared/utils/common.utils';
import {Injectable} from '@angular/core';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../../core/store/link-instances/link.instance';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Query} from '../../../../../core/store/navigation/query';
import {ChartData, ChartDataSet, ChartPoint, ChartYAxisType} from './chart-data';
import {getOtherLinkedCollectionId} from '../../../../../shared/utils/link-type.utils';
import {hex2rgba} from '../../../../../shared/utils/html-modifier';

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
      const data = this.iterate(chain, dataMap, config.sort);
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
      ].filter(index => isNotNullOrUndefind(index))
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

  private iterate(chain: AxisResourceChain[], dataMap: ObjectDataMap, sort: ChartSort): DataMap {
    const dataObjects = Object.values(dataMap[chain[0].resource.id] || {});
    const sortedDataObjects = sortDataObjects(dataObjects, sort);
    const data = {};
    this.iterateRecursive(sortedDataObjects, data, chain, 0, dataMap);
    return data;
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
        .filter(obj => isNotNullOrUndefind(obj.value));
      data.push(...values);
      return;
    }
    const forward = chain[index + 1].index < stage.index;

    for (const object of objectData) {
      const nextStage = chain[index + 1];
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
          if (!data[value]) {
            data[value] = stage.asIdOfArray ? [] : {};
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

    for (const key of xEntries) {
      const nestedValue: Record<string, {id: string; value: any}[]> = data[key];
      const nestedKeys = Object.keys(nestedValue);
      for (const nestedKey of nestedKeys) {
        if (!pointsMap[nestedKey]) {
          pointsMap[nestedKey] = [];
          isNumericMap[nestedKey] = true;
        }

        const valueObjects: {id: string; value: any}[] = nestedValue[nestedKey];
        const values = valueObjects.map(obj => obj.value);
        const yValue = aggregate(config.aggregations && config.aggregations[yAxisType], values);
        if (yValue) {
          const id = canDragAxis && valueObjects.length === 1 ? valueObjects[0].id : null;
          isNumericMap[nestedKey] = isNumericMap[nestedKey] && isNumeric(yValue);
          pointsMap[nestedKey].push({id, x: key, y: yValue});
          draggable = draggable || isNotNullOrUndefind(id);
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
        isNumeric: isNumericMap[name],
        yAxisType,
        draggable,
        resourceType: axisResourceTypeFromResourceId(axisResource.id),
      });
      colorAlpha -= colorAlphaStep;
    }

    return sets;
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
    const sortedDataObjects = sortDataObjects(documents, config.sort);

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
    for (const dataObject of dataObjects) {
      const xValue = xAxis && dataObject.data[xAxis.attributeId];
      const yValue = yAxis && dataObject.data[yAxis.attributeId];
      if (isNullOrUndefined(xValue) && isNullOrUndefined(yValue)) {
        continue;
      }

      // we know that x or y is set
      if (isNotNullOrUndefind(xValue) && actualValues.has(xValue)) {
        continue;
      }

      if (isNotNullOrUndefind(yValue) && actualValues.has(yValue)) {
        continue;
      }

      const id = draggable ? dataObject.id : null;
      isNum = isNum && isNumeric(xValue || yValue);
      points.push({id, x: xValue, y: yValue});
      actualValues.add(xValue || yValue);
    }

    const name = this.getAttributeNameForAxis(yAxis, axisResource);

    const dataSet: ChartDataSet = {
      id: (yAxis && yAxis.attributeId) || null,
      points,
      color: axisResource.color,
      isNumeric: isNum,
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
    const attribute = collection && collection.attributes && collection.attributes.find(a => a.id === attributeId);
    return this.isAttributeEditable(attribute);
  }

  private isAttributeEditable(attribute: Attribute): boolean {
    return attribute && (!attribute.function || attribute.function.editable);
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

    const attribute = linkType.attributes && linkType.attributes.find(a => a.id === attributeId);
    return this.isAttributeEditable(attribute);
  }

  private getAttributeNameForAxis(axis: ChartAxis, axisResource: AxisResource): string {
    const attribute = axis && (axisResource.attributes || []).find(attr => attr.id === axis.attributeId);
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
      const xValue = dataObject.data[xAxis.attributeId];
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

    for (const key of xEntries) {
      const valueObjects: {id: string; value: any}[] = data[key];
      const values = valueObjects.map(obj => obj.value);
      const yValue = aggregate(config.aggregations && config.aggregations[yAxisType], values);
      if (isNotNullOrUndefind(yValue)) {
        const id = canDragAxis && valueObjects.length === 1 ? valueObjects[0].id : null;
        isNum = isNum && isNumeric(yValue);
        points.push({id, x: key, y: yValue});
        draggable = draggable || isNotNullOrUndefind(id);
      }
    }

    const yAxis = config.axes && config.axes[yAxisType];
    const name = this.getAttributeNameForAxis(yAxis, axisResource);

    const dataSet = {
      id: this.yAxisCollectionId(config, yAxisType),
      points,
      color: axisResource.color,
      isNumeric: isNum,
      yAxisType,
      name,
      draggable,
      resourceType: axisResourceTypeFromResourceId(axisResource.id),
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
      isNumeric: true,
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

function sortDataObjects(dataObjects: ObjectDataWithLinks[], sort: ChartSort): ObjectDataWithLinks[] {
  if (
    !dataObjects ||
    dataObjects.length === 0 ||
    !sort ||
    !sort.axis ||
    dataObjects[0].resourceId !== axisResourceId(sort.axis.axisResourceType, sort.axis.resourceId)
  ) {
    return dataObjects || [];
  }

  const asc = sort.type === ChartSortType.Ascending;
  return dataObjects.sort((a, b) => compareValues(a.data[sort.axis.attributeId], b.data[sort.axis.attributeId], asc));
}

function areDataNested(data: DataMap, keys: string[]): boolean {
  const value = data[keys[0]];
  return !Array.isArray(value);
}

function compareValues(a: any, b: any, asc: boolean): number {
  const multiplier = asc ? 1 : -1;
  if (isNullOrUndefined(a) && isNullOrUndefined(b)) {
    return 0;
  } else if (isNullOrUndefined(b)) {
    return multiplier;
  } else if (isNullOrUndefined(a)) {
    return -1 * multiplier;
  }

  if (a > b) {
    return multiplier;
  } else if (b > a) {
    return -1 * multiplier;
  }

  return 0;
}

function aggregate(aggregation: ChartAggregation, values: any[]): any {
  if (values.length === 1) {
    return values[0];
  }

  switch (aggregation) {
    case ChartAggregation.Sum:
      return sumValues(values);
    case ChartAggregation.Avg:
      return avgValues(values);
    case ChartAggregation.Min:
      return minInValues(values);
    case ChartAggregation.Max:
      return maxInValues(values);
    default:
      return sumValues(values);
  }
}

function sumValues(values: any[]): any {
  const numericValues = values.filter(value => isNumeric(value));
  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + +value, 0);
}

function avgValues(values: any[]): any {
  const numericValues = values.filter(value => isNumeric(value));
  if (numericValues.length === 0) {
    return null;
  }

  return numericValues.reduce((sum, value) => sum + +value, 0) / numericValues.length;
}

function minInValues(values: any[]): any {
  const sortedValues = values.sort((a, b) => (a > b ? 1 : -1));
  return sortedValues[0];
}

function maxInValues(values: any[]): any {
  const sortedValues = values.sort((a, b) => (a > b ? -1 : 1));
  return sortedValues[0];
}
