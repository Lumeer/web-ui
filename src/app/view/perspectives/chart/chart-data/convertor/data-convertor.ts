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
import {ChartData, ChartDataSet, ChartLegendEntry, ChartPoint, ChartYAxisType} from './chart-data';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../../core/store/link-instances/link.instance';
import {Query} from '../../../../../core/store/navigation/query';
import {queryStemCollectionsOrder} from '../../../../../core/store/navigation/query.util';
import {isNotNullOrUndefind, isNullOrUndefined, isNumeric} from '../../../../../shared/utils/common.utils';
import {hex2rgba} from '../../../../../shared/utils/html-modifier';

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
 *  {key1: {key2 .... : {keyN: []} ... } where key is used for group data and array for data aggregation
 *  if dataset name is set then N = 2; else N = 1
 */
type DocumentsData = Record<string, any>;

export function convertChartData(
  config: ChartConfig,
  documents: DocumentModel[],
  collections: Collection[],
  query: Query,
  linkTypes?: LinkType[],
  linkInstances?: LinkInstance[]
): ChartData {
  const xAxis = config.axes[ChartAxisType.X];
  const y1Axis = config.axes[ChartAxisType.Y1];
  const y2Axis = config.axes[ChartAxisType.Y2];

  if (!xAxis && !y1Axis && !y2Axis) {
    return createEmptyData(config.type);
  }

  const collectionIdsOrder = queryStemCollectionsOrder(linkTypes || [], query.stems && query.stems[0]);
  const baseCollection = collections.find(collection => collection.id === collectionIdsOrder[0]);
  const documentsMap = createDocumentsMap(collectionIdsOrder, documents, linkTypes, linkInstances);

  // console.log(collectionIdsOrder, baseCollection, documentsMap);

  if (y1Axis && y2Axis) {
    const data1 = convertAxis(config, ChartAxisType.Y1, baseCollection, documentsMap, collectionIdsOrder);
    const data2 = convertAxis(config, ChartAxisType.Y2, baseCollection, documentsMap, collectionIdsOrder);
    return mergeData(data1, data2);
  } else if (!y2Axis && (xAxis || y1Axis)) {
    return convertAxis(config, ChartAxisType.Y1, baseCollection, documentsMap, collectionIdsOrder);
  } else if (xAxis || y2Axis) {
    return convertAxis(config, ChartAxisType.Y2, baseCollection, documentsMap, collectionIdsOrder);
  }

  return createEmptyData(config.type);
}

function createDocumentsMap(
  collectionIdsOrder: string[],
  documents: DocumentModel[],
  linkTypes?: LinkType[],
  linkInstances?: LinkInstance[]
): DocumentsMap {
  const collectionIdsOrderMap = collectionIdsOrder.reduce((idsMap, id, index) => ({...idsMap, [id]: index}), {});
  const linkTypeIds = new Set((linkTypes || []).map(lt => lt.id));
  const allDocumentsMap: Record<string, DocumentModel> = {};
  const map: DocumentsMap = {};

  for (const document of documents) {
    allDocumentsMap[document.id] = document;

    if (!map[document.collectionId]) {
      map[document.collectionId] = {};
    }

    map[document.collectionId][document.id] = {...document, linksTo: [], linksFrom: []};
  }

  for (const linkInstance of linkInstances || []) {
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

function convertAxis(
  config: ChartConfig,
  yAxisType: ChartYAxisType,
  baseCollection: Collection,
  documentsMap: DocumentsMap,
  collectionIdsOrder: string[]
): ChartData {
  const xAxis = config.axes[ChartAxisType.X];
  const yAxis = config.axes[yAxisType];
  const yName = config.names && config.names[yAxisType];

  if (areChartAxesThroughLink(xAxis, yAxis, yName)) {
    const chain = createCollectionChain(collectionIdsOrder, xAxis, yAxis, yName);
    const data = iterate(chain, documentsMap, config.sort);
    return convertDocumentsMapData(data, config, baseCollection, yAxisType);
  }

  return convertSingleAxis(yAxisType, config, documentsMap, baseCollection, xAxis, yAxis);
}

function areChartAxesThroughLink(xAxis?: ChartAxis, yAxis?: ChartAxis, yName?: ChartAxis): boolean {
  const y1CollectionIndexes = new Set(
    [
      xAxis && xAxis.collectionIndex,
      yAxis && yAxis.collectionIndex,
      xAxis && yAxis && yName && yName.collectionIndex,
    ].filter(index => isNotNullOrUndefind(index))
  );
  return y1CollectionIndexes.size > 1;
}

function createCollectionChain(
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
    const nameSubChain = createCollectionChainForRange(
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

  const axisSubChain = createCollectionChainForRange(collectionIdsOrder, collectionIndex, yAxis.collectionIndex);
  chain.push(...axisSubChain);

  chain.push({index: yAxis.collectionIndex, collectionId: yAxis.collectionId, attributeId: yAxis.attributeId});

  return chain;
}

function createCollectionChainForRange(
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

function iterate(chain: CollectionChain[], documentsMap: DocumentsMap, sort: ChartSort): DocumentsData {
  const documents = Object.values(documentsMap[chain[0].collectionId] || {});
  const sortedDocuments = sortDocuments(documents, sort);
  const data = {};
  iterateRecursive(sortedDocuments, data, chain, 0, documentsMap);
  return data;
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

function iterateRecursive(
  documents: DocumentWithLinks[],
  data: DocumentsData,
  chain: CollectionChain[],
  index: number,
  documentsMap: DocumentsMap
) {
  const stage = chain[index];
  if (index === chain.length - 1) {
    const values = documents.map(d => d.data[stage.attributeId]).filter(value => isNotNullOrUndefind(value));
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
      const values = getDocumentValues(document, stage.attributeId);
      if (values.length === 0) {
        continue;
      }

      for (const value of values) {
        if (!data[value]) {
          data[value] = stage.asIdOfArray ? [] : {};
        }
        iterateRecursive(linkedDocumentsWithLinks, data[value], chain, index + 1, documentsMap);
      }
    } else {
      iterateRecursive(linkedDocumentsWithLinks, data, chain, index + 1, documentsMap);
    }
  }
}

function getDocumentValues(document: DocumentModel, attributeId: string): any[] {
  const value = document.data[attributeId];
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function convertDocumentsMapData(
  data: DocumentsData,
  config: ChartConfig,
  baseCollection: Collection,
  yAxisType: ChartYAxisType
): ChartData {
  const xEntries = Object.keys(data);
  if (xEntries.length === 0) {
    return createEmptyData(config.type);
  }

  if (areDataNested(data, xEntries)) {
    return convertDocumentsMapDataNested(data, xEntries, config, baseCollection, yAxisType);
  }

  return convertDocumentsMapDataSimple(data, xEntries, config, baseCollection, yAxisType);
}

function convertDocumentsMapDataNested(
  data: DocumentsData,
  xEntries: string[],
  config: ChartConfig,
  baseCollection: Collection,
  yAxisType: ChartYAxisType
): ChartData {
  const isNumericMap: Record<string, boolean> = {};
  const pointsMap: Record<string, ChartPoint[]> = {};

  for (const key of xEntries) {
    const nestedValue: Record<string, any[]> = data[key];
    const nestedKeys = Object.keys(nestedValue);
    for (const nestedKey of nestedKeys) {
      if (!pointsMap[nestedKey]) {
        pointsMap[nestedKey] = [];
        isNumericMap[nestedKey] = true;
      }

      const values = nestedValue[nestedKey] as any[];
      const yValue = aggregate(config.aggregations && config.aggregations[yAxisType], values);
      if (yValue) {
        isNumericMap[nestedKey] = isNumericMap[nestedKey] && isNumeric(yValue);
        pointsMap[nestedKey].push({x: key, y: yValue});
      }
    }
  }

  const sets: ChartDataSet[] = [];
  const legendEntries: ChartLegendEntry[] = [];
  const legendEntriesNames = Object.keys(pointsMap);
  let colorAlpha = 100;
  const colorAlphaStep = 70 / Math.max(1, legendEntriesNames.length - 1); // min alpha is 30

  for (let i = 0; i < legendEntriesNames.length; i++) {
    const name = legendEntriesNames[i];
    const color = hex2rgba(baseCollection.color, colorAlpha / 100);
    legendEntries.push({color, value: name});
    sets.push({id: baseCollection.id, points: pointsMap[name], color, name, isNumeric: isNumericMap[name], yAxisType});
    colorAlpha -= colorAlphaStep;
  }

  return {sets, legend: {entries: legendEntries}, type: config.type};
}

function convertDocumentsMapDataSimple(
  data: DocumentsData,
  xEntries: string[],
  config: ChartConfig,
  baseCollection: Collection,
  yAxisType: ChartYAxisType,
  documentIds?: Record<string, string>
): ChartData {
  let isNum = true;
  const points: ChartPoint[] = [];
  for (const key of xEntries) {
    const values = data[key] as any[];
    const id = documentIds && values.length === 1 ? documentIds[key] : undefined;
    const yValue = aggregate(config.aggregations && config.aggregations[yAxisType], values);
    if (isNotNullOrUndefind(yValue)) {
      isNum = isNum && isNumeric(yValue);
      points.push({id, x: key, y: yValue});
    }
  }

  const yAxis = config.axes && config.axes[yAxisType];
  const name = getAttributeNameForAxis(yAxis, baseCollection);

  const dataSet = {id: baseCollection.id, points, color: baseCollection.color, isNumeric: isNum, yAxisType, name};
  return {sets: [dataSet], legend: {entries: []}, type: config.type};
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
      return values[0];
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

function convertSingleAxis(
  yAxisType: ChartYAxisType,
  config: ChartConfig,
  documentsMap: DocumentsMap,
  collection: Collection,
  xAxis?: ChartAxis,
  yAxis?: ChartAxis
): ChartData {
  const documents = Object.values(documentsMap[collection.id] || {});
  const sortedDocuments = sortDocuments(documents, config.sort);

  if (!xAxis || !yAxis) {
    return convertSingleAxisSimple(yAxisType, config.type, sortedDocuments, collection, xAxis, yAxis);
  }

  if (config.aggregations && config.aggregations[yAxisType]) {
    return convertSingleAxisWithAggregation(yAxisType, config, sortedDocuments, collection, xAxis, yAxis);
  }

  return convertSingleAxisWithoutAggregation(yAxisType, config, sortedDocuments, collection, xAxis, yAxis);
}

function convertSingleAxisWithAggregation(
  yAxisType: ChartYAxisType,
  config: ChartConfig,
  documents: DocumentModel[],
  collection: Collection,
  xAxis?: ChartAxis,
  yAxis?: ChartAxis
): ChartData {
  const data: DocumentsData = {};
  const idsMap: Record<string, string> = {};
  for (const document of documents) {
    const xValue = document.data[xAxis.attributeId];
    const yValue = document.data[yAxis.attributeId];
    if (isNullOrUndefined(xValue) || isNullOrUndefined(yValue)) {
      continue;
    }
    if (!data[xValue]) {
      data[xValue] = [];
    }
    data[xValue].push(yValue);
    idsMap[xValue] = document.id;
  }

  return convertDocumentsMapDataSimple(data, Object.keys(data), config, collection, yAxisType, idsMap);
}

function convertSingleAxisWithoutAggregation(
  yAxisType: ChartYAxisType,
  config: ChartConfig,
  documents: DocumentModel[],
  collection: Collection,
  xAxis?: ChartAxis,
  yAxis?: ChartAxis
): ChartData {
  let isNum = true;

  const points: ChartPoint[] = [];
  for (const document of documents) {
    const xValue = xAxis && document.data[xAxis.attributeId];
    const yValue = yAxis && document.data[yAxis.attributeId];
    if (isNullOrUndefined(xValue) && isNullOrUndefined(yValue)) {
      continue;
    }

    isNum = isNum && isNumeric(yValue);
    points.push({id: document.id, x: xValue, y: yValue});
  }

  const name = getAttributeNameForAxis(yAxis, collection);

  const dataSet = {id: collection.id, points, color: collection.color, isNumeric: isNum, yAxisType, name};
  return {sets: [dataSet], legend: {entries: []}, type: config.type};
}

function convertSingleAxisSimple(
  yAxisType: ChartYAxisType,
  type: ChartType,
  documents: DocumentModel[],
  collection: Collection,
  xAxis?: ChartAxis,
  yAxis?: ChartAxis
): ChartData {
  let isNum = true;

  const actualValues = new Set();
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

    isNum = isNum && isNumeric(xValue || yValue);
    points.push({id: document.id, x: xValue, y: yValue});
    actualValues.add(xValue || yValue);
  }

  const name = getAttributeNameForAxis(yAxis, collection);

  const dataSet = {id: collection.id, points, color: collection.color, isNumeric: isNum, yAxisType, name};
  return {sets: [dataSet], legend: {entries: []}, type};
}

function getAttributeNameForAxis(axis: ChartAxis, collection: Collection): string {
  const attribute = axis && (collection.attributes || []).find(attr => attr.id === axis.attributeId);
  return attribute && attribute.name;
}

function mergeData(data1: ChartData, data2: ChartData): ChartData {
  return {
    sets: [...data1.sets, ...data2.sets],
    legend: {entries: [...data1.legend.entries, ...data2.legend.entries]},
    type: data1.type,
  };
}

function createEmptyData(type: ChartType): ChartData {
  return {sets: [], legend: {entries: []}, type};
}
