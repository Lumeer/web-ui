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

import {Collection} from '../../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {
  ChartAggregation,
  ChartAxis,
  ChartAxisType,
  ChartConfig,
  ChartSort,
  ChartSortType,
  ChartType,
} from '../../../../../core/store/charts/chart';
import {ChartData, ChartDataSet, ChartPoint, ChartYAxisType} from './chart-data';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../../core/store/link-instances/link.instance';
import {Query} from '../../../../../core/store/navigation/query';
import {queryStemCollectionsOrder} from '../../../../../core/store/navigation/query.util';
import {isNotNullOrUndefind, isNullOrUndefined, isNumeric} from '../../../../../shared/utils/common.utils';
import {hex2rgba} from '../../../../../shared/utils/html-modifier';
import {Injectable} from '@angular/core';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';

interface DocumentWithLinks extends DocumentModel {
  linksTo: DocumentModel[];
  linksFrom: DocumentModel[];
}

interface CollectionChain {
  index: number;
  collectionId: string;
  attributeId?: string;
  asIdOfArray?: boolean;
  asIdOfObject?: boolean;
}

type DocumentsMap = Record<string, Record<string, DocumentWithLinks>>;
/*
 * Structure of data is:
 *  {key1: {key2 .... : {keyN: [{value: any, id: string}]} ... } where key is used for group data and array for data aggregation
 *  if dataset name is set then N = 2; else N = 1
 */
type DocumentsData = Record<string, any>;

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
    this.currentConfig = {...this.currentConfig, type};
    return {
      type,
      sets: [...(this.y1Sets || []), ...(this.y2Sets || [])],
    };
  }

  public convert(config: ChartConfig): ChartData {
    const xAxis = config.axes[ChartAxisType.X];
    const y1Axis = config.axes[ChartAxisType.Y1];
    const y2Axis = config.axes[ChartAxisType.Y2];

    if (!xAxis && !y1Axis && !y2Axis) {
      return this.createEmptyData(config);
    }

    const collectionIdsOrder = queryStemCollectionsOrder(this.linkTypes || [], this.query.stems && this.query.stems[0]);
    const baseCollection = this.collections.find(collection => collection.id === collectionIdsOrder[0]);
    const documentsMap = this.createDocumentsMap(collectionIdsOrder);

    if (y1Axis && y2Axis) {
      this.y1Sets = this.convertAxis(config, ChartAxisType.Y1, baseCollection, documentsMap, collectionIdsOrder);
      this.y2Sets = this.convertAxis(config, ChartAxisType.Y2, baseCollection, documentsMap, collectionIdsOrder);
      this.currentConfig = config;
      return this.convertType(config.type);
    } else if (!y2Axis && (xAxis || y1Axis)) {
      this.y1Sets = this.convertAxis(config, ChartAxisType.Y1, baseCollection, documentsMap, collectionIdsOrder);
      this.y2Sets = [];
      this.currentConfig = config;
      return this.convertType(config.type);
    } else if (xAxis || y2Axis) {
      this.y1Sets = [];
      this.y2Sets = this.convertAxis(config, ChartAxisType.Y2, baseCollection, documentsMap, collectionIdsOrder);
      this.currentConfig = config;
      return this.convertType(config.type);
    }

    return this.createEmptyData(config);
  }

  private createDocumentsMap(collectionIdsOrder: string[]): DocumentsMap {
    const collectionIdsOrderMap = collectionIdsOrder.reduce((idsMap, id, index) => ({...idsMap, [id]: index}), {});
    const linkTypeIds = new Set((this.linkTypes || []).map(lt => lt.id));
    const allDocumentsMap: Record<string, DocumentModel> = {};
    const map: DocumentsMap = {};

    for (const document of this.documents) {
      allDocumentsMap[document.id] = document;

      if (!map[document.collectionId]) {
        map[document.collectionId] = {};
      }

      map[document.collectionId][document.id] = {...document, linksTo: [], linksFrom: []};
    }

    for (const linkInstance of this.linkInstances || []) {
      const document1 = allDocumentsMap[linkInstance.documentIds[0]];
      const document2 = allDocumentsMap[linkInstance.documentIds[1]];
      const document1Map = document1 && map[document1.collectionId];
      const document2Map = document2 && map[document2.collectionId];

      if (!document1 || !document1Map || !document2 || !document2Map || !linkTypeIds.has(linkInstance.linkTypeId)) {
        continue;
      }

      const document1CollectionIndex = collectionIdsOrderMap[document1.collectionId];
      const document2CollectionIndex = collectionIdsOrderMap[document2.collectionId];
      if (document1CollectionIndex <= document2CollectionIndex) {
        document1Map[document1.id].linksTo.push(document2);
        document2Map[document2.id].linksFrom.push(document1);
      } else {
        document2Map[document2.id].linksTo.push(document1);
        document1Map[document1.id].linksFrom.push(document2);
      }
    }

    return map;
  }

  private convertAxis(
    config: ChartConfig,
    yAxisType: ChartYAxisType,
    baseCollection: Collection,
    documentsMap: DocumentsMap,
    collectionIdsOrder: string[]
  ): ChartDataSet[] {
    const xAxis = config.axes[ChartAxisType.X];
    const yAxis = config.axes[yAxisType];
    const yName = config.names && config.names[yAxisType];

    if (this.areChartAxesThroughLink(xAxis, yAxis, yName)) {
      const chain = this.createCollectionChain(collectionIdsOrder, xAxis, yAxis, yName);
      const data = this.iterate(chain, documentsMap, config.sort);
      return this.convertDocumentsMapData(data, config, baseCollection, yAxisType);
    }

    return this.convertSingleAxis(yAxisType, config, documentsMap, baseCollection, xAxis, yAxis);
  }

  private areChartAxesThroughLink(xAxis?: ChartAxis, yAxis?: ChartAxis, yName?: ChartAxis): boolean {
    const y1CollectionIndexes = new Set(
      [
        xAxis && xAxis.collectionIndex,
        yAxis && yAxis.collectionIndex,
        xAxis && yAxis && yName && yName.collectionIndex,
      ].filter(index => isNotNullOrUndefind(index))
    );
    return y1CollectionIndexes.size > 1;
  }

  private createCollectionChain(
    collectionIdsOrder: string[],
    xAxis: ChartAxis,
    yAxis: ChartAxis,
    yName?: ChartAxis
  ): CollectionChain[] {
    let collectionIndex = xAxis.collectionIndex;
    const chain: CollectionChain[] = [
      {
        index: xAxis.collectionIndex,
        collectionId: xAxis.collectionId,
        attributeId: xAxis.attributeId,
        asIdOfArray: !yName,
        asIdOfObject: !!yName,
      },
    ];

    if (yName) {
      const nameSubChain = this.createCollectionChainForRange(
        collectionIdsOrder,
        xAxis.collectionIndex,
        yName.collectionIndex
      );
      chain.push(...nameSubChain);

      chain.push({
        index: yName.collectionIndex,
        collectionId: yName.collectionId,
        attributeId: yName.attributeId,
        asIdOfArray: true,
      });
      collectionIndex = yName.collectionIndex;
    }

    const axisSubChain = this.createCollectionChainForRange(collectionIdsOrder, collectionIndex, yAxis.collectionIndex);
    chain.push(...axisSubChain);

    chain.push({index: yAxis.collectionIndex, collectionId: yAxis.collectionId, attributeId: yAxis.attributeId});

    return chain;
  }

  private createCollectionChainForRange(
    collectionIdsOrder: string[],
    startIndex: number,
    endIndex: number
  ): CollectionChain[] {
    const chain: CollectionChain[] = [];
    if (startIndex > endIndex) {
      for (let i = startIndex - 1; i > endIndex; i--) {
        chain.push({index: i, collectionId: collectionIdsOrder[i]});
      }
    } else {
      for (let i = startIndex + 1; i < endIndex; i++) {
        chain.push({index: i, collectionId: collectionIdsOrder[i]});
      }
    }
    return chain;
  }

  private iterate(chain: CollectionChain[], documentsMap: DocumentsMap, sort: ChartSort): DocumentsData {
    const documents = Object.values(documentsMap[chain[0].collectionId] || {});
    const sortedDocuments = sortDocuments(documents, sort);
    const data = {};
    this.iterateRecursive(sortedDocuments, data, chain, 0, documentsMap);
    return data;
  }

  private iterateRecursive(
    documents: DocumentWithLinks[],
    data: DocumentsData,
    chain: CollectionChain[],
    index: number,
    documentsMap: DocumentsMap
  ) {
    const stage = chain[index];
    if (index === chain.length - 1) {
      const values = documents
        .map(d => ({id: d.id, value: d.data[stage.attributeId]}))
        .filter(obj => isNotNullOrUndefind(obj.value));
      data.push(...values);
      return;
    }
    const forward = chain[index + 1].index < stage.index;

    for (const document of documents) {
      const nextStage = chain[index + 1];
      const linkedDocuments = forward ? document.linksFrom : document.linksTo;
      const nextCollectionDocuments = documentsMap[nextStage.collectionId] || {};
      const linkedDocumentsWithLinks = linkedDocuments
        .filter(d => d.collectionId === nextStage.collectionId)
        .map(d => nextCollectionDocuments[d.id]);

      if (stage.asIdOfArray || stage.asIdOfObject) {
        const values = this.getDocumentValues(document, stage.attributeId);
        if (values.length === 0) {
          continue;
        }

        for (const value of values) {
          if (!data[value]) {
            data[value] = stage.asIdOfArray ? [] : {};
          }
          this.iterateRecursive(linkedDocumentsWithLinks, data[value], chain, index + 1, documentsMap);
        }
      } else {
        this.iterateRecursive(linkedDocumentsWithLinks, data, chain, index + 1, documentsMap);
      }
    }
  }

  private getDocumentValues(document: DocumentModel, attributeId: string): any[] {
    const value = document.data[attributeId];
    if (!value) {
      return [];
    }

    return Array.isArray(value) ? value : [value];
  }

  private convertDocumentsMapData(
    data: DocumentsData,
    config: ChartConfig,
    baseCollection: Collection,
    yAxisType: ChartYAxisType
  ): ChartDataSet[] {
    const xEntries = Object.keys(data);
    if (xEntries.length === 0) {
      return [];
    }

    if (areDataNested(data, xEntries)) {
      return this.convertDocumentsMapDataNested(data, xEntries, config, baseCollection, yAxisType);
    }

    return this.convertDocumentsMapDataSimple(data, xEntries, config, baseCollection, yAxisType);
  }

  private convertDocumentsMapDataNested(
    data: DocumentsData,
    xEntries: string[],
    config: ChartConfig,
    baseCollection: Collection,
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
      const color = hex2rgba(baseCollection.color, colorAlpha / 100);
      sets.push({
        id: this.yAxisCollectionId(config, yAxisType),
        points: pointsMap[name],
        color,
        name,
        isNumeric: isNumericMap[name],
        yAxisType,
        draggable,
      });
      colorAlpha -= colorAlphaStep;
    }

    return sets;
  }

  private canDragAxis(config: ChartConfig, yAxisType: ChartYAxisType): boolean {
    const yAxis = config.axes[yAxisType];
    const permission = this.permissions && yAxis && this.permissions[yAxis.collectionId];
    return (permission && permission.writeWithView) || false;
  }

  private yAxisCollectionId(config: ChartConfig, yAxisType: ChartYAxisType): string {
    const yAxis = config.axes[yAxisType];
    return (yAxis && yAxis.attributeId) || null;
  }

  private convertDocumentsMapDataSimple(
    data: DocumentsData,
    xEntries: string[],
    config: ChartConfig,
    baseCollection: Collection,
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
    const name = this.getAttributeNameForAxis(yAxis, baseCollection);

    const dataSet = {
      id: this.yAxisCollectionId(config, yAxisType),
      points,
      color: baseCollection.color,
      isNumeric: isNum,
      yAxisType,
      name,
      draggable,
    };
    return [dataSet];
  }

  private convertSingleAxis(
    yAxisType: ChartYAxisType,
    config: ChartConfig,
    documentsMap: DocumentsMap,
    collection: Collection,
    xAxis?: ChartAxis,
    yAxis?: ChartAxis
  ): ChartDataSet[] {
    const documents = Object.values(documentsMap[collection.id] || {});
    const sortedDocuments = sortDocuments(documents, config.sort);

    if (!xAxis || !yAxis) {
      return this.convertSingleAxisSimple(yAxisType, config, sortedDocuments, collection, xAxis, yAxis);
    }
    return this.convertSingleAxisWithAggregation(yAxisType, config, sortedDocuments, collection, xAxis, yAxis);
  }

  private convertSingleAxisWithAggregation(
    yAxisType: ChartYAxisType,
    config: ChartConfig,
    documents: DocumentModel[],
    collection: Collection,
    xAxis?: ChartAxis,
    yAxis?: ChartAxis
  ): ChartDataSet[] {
    const data: DocumentsData = {};
    for (const document of documents) {
      const xValue = document.data[xAxis.attributeId];
      const yValue = document.data[yAxis.attributeId];
      if (isNullOrUndefined(xValue) || isNullOrUndefined(yValue)) {
        continue;
      }
      if (!data[xValue]) {
        data[xValue] = [];
      }
      data[xValue].push({id: document.id, value: yValue});
    }

    return this.convertDocumentsMapDataSimple(data, Object.keys(data), config, collection, yAxisType);
  }

  private convertSingleAxisSimple(
    yAxisType: ChartYAxisType,
    config: ChartConfig,
    documents: DocumentModel[],
    collection: Collection,
    xAxis?: ChartAxis,
    yAxis?: ChartAxis
  ): ChartDataSet[] {
    let isNum = true;
    const actualValues = new Set();
    const draggable = this.canDragAxis(config, yAxisType);
    const points: ChartPoint[] = [];
    for (const document of documents) {
      const xValue = xAxis && document.data[xAxis.attributeId];
      const yValue = yAxis && document.data[yAxis.attributeId];
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

      const id = draggable ? document.id : null;
      isNum = isNum && isNumeric(xValue || yValue);
      points.push({id, x: xValue, y: yValue});
      actualValues.add(xValue || yValue);
    }

    const name = this.getAttributeNameForAxis(yAxis, collection);

    const dataSet: ChartDataSet = {
      id: (yAxis && yAxis.attributeId) || null,
      points,
      color: collection.color,
      isNumeric: isNum,
      yAxisType,
      name,
      draggable,
    };
    return [dataSet];
  }

  private getAttributeNameForAxis(axis: ChartAxis, collection: Collection): string {
    const attribute = axis && (collection.attributes || []).find(attr => attr.id === axis.attributeId);
    return attribute && attribute.name;
  }

  public convertAxisType(config: ChartConfig, type: ChartYAxisType): ChartData {
    const collectionIdsOrder = queryStemCollectionsOrder(this.linkTypes || [], this.query.stems && this.query.stems[0]);
    const baseCollection = this.collections.find(collection => collection.id === collectionIdsOrder[0]);
    const documentsMap = this.createDocumentsMap(collectionIdsOrder);

    const sets = this.convertAxis(config, type, baseCollection, documentsMap, collectionIdsOrder);
    if (type === ChartAxisType.Y1) {
      this.y1Sets = sets;
    } else {
      this.y2Sets = sets;
    }
    this.currentConfig = config;
    return this.convertType(config.type);
  }

  private createEmptyData(config: ChartConfig): ChartData {
    this.y1Sets = [];
    this.y2Sets = [];
    this.currentConfig = config;
    return {sets: [], type: config.type};
  }
}

function sortDocuments(documents: DocumentWithLinks[], sort: ChartSort): DocumentWithLinks[] {
  if (
    !document ||
    documents.length === 0 ||
    !sort ||
    !sort.axis ||
    documents[0].collectionId !== sort.axis.collectionId
  ) {
    return documents || [];
  }

  const asc = sort.type === ChartSortType.Ascending;
  return documents.sort((a, b) => compareValues(a.data[sort.axis.attributeId], b.data[sort.axis.attributeId], asc));
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

function areDataNested(data: DocumentsData, keys: string[]): boolean {
  const value = data[keys[0]];
  return !Array.isArray(value);
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
