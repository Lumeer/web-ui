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

import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {ChartAggregation, ChartAxis, ChartAxisType, ChartConfig, ChartType} from '../../../../core/store/charts/chart';
import {ChartData, ChartDataSet, ChartLegendEntry, ChartPoint, ChartYAxisType} from './chart-data';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {Query} from '../../../../core/store/navigation/query';
import {queryStemCollectionsOrder} from '../../../../core/store/navigation/query.util';
import {isNotNullOrUndefind} from '../../../../shared/utils/common.utils';
import {hex2rgba} from '../../../../shared/utils/html-modifier';

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
 *  if dataset name is set N = 2; else N = 1
 */
type DocumentsData = Record<string, any>;

export class DataConvertor {
  public convert(
    config: ChartConfig,
    documents: DocumentModel[],
    collections: Collection[],
    query: Query,
    linkTypes: LinkType[],
    linkInstances: LinkInstance[]
  ): ChartData {
    const collectionIdsOrder = queryStemCollectionsOrder(linkTypes, query.stems && query.stems[0]);
    const baseCollection = collections.find(collection => collection.id === collectionIdsOrder[0]);
    const documentsMap = this.createDocumentsMap(collectionIdsOrder, documents, linkTypes, linkInstances);

    const xAxis = config.axes[ChartAxisType.X];
    const y1Axis = config.axes[ChartAxisType.Y1];
    const y2Axis = config.axes[ChartAxisType.Y2];

    if (y1Axis && y2Axis) {
      const data1 = this.convertAxis(config, ChartAxisType.Y1, baseCollection, documentsMap, collectionIdsOrder);
      const data2 = this.convertAxis(config, ChartAxisType.Y2, baseCollection, documentsMap, collectionIdsOrder);
      return this.mergeData(data1, data2);
    } else if (!y1Axis && (xAxis || y2Axis)) {
      return this.convertAxis(config, ChartAxisType.Y2, baseCollection, documentsMap, collectionIdsOrder);
    } else if (xAxis || y1Axis) {
      return this.convertAxis(config, ChartAxisType.Y1, baseCollection, documentsMap, collectionIdsOrder);
    }

    return this.createEmptyData(config.type);
  }

  private createDocumentsMap(
    collectionIdsOrder: string[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[]
  ): DocumentsMap {
    const collectionIdsOrderMap = collectionIdsOrder.reduce((idsMap, id, index) => ({...idsMap, [id]: index}), {});
    const linkTypeIds = new Set(linkTypes.map(lt => lt.id));
    const allDocumentsMap: Record<string, DocumentModel> = {};
    const map: DocumentsMap = {};

    for (const document of documents) {
      allDocumentsMap[document.id] = document;

      if (!map[document.collectionId]) {
        map[document.collectionId] = {};
      }

      map[document.collectionId][document.id] = {...document, linksTo: [], linksFrom: []};
    }

    for (const linkInstance of linkInstances) {
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
    yAxisType: ChartAxisType.Y1 | ChartAxisType.Y2,
    baseCollection: Collection,
    documentsMap: DocumentsMap,
    collectionIdsOrder: string[]
  ): ChartData {
    const xAxis = config.axes[ChartAxisType.X];
    const yAxis = config.axes[yAxisType];
    const yName = config.names[yAxisType];

    const chartYAxisType = yAxisType === ChartAxisType.Y1 ? ChartYAxisType.Y1 : ChartYAxisType.Y2;

    if (this.areChartAxesThroughLink(xAxis, yAxis, yName)) {
      const chain = this.createCollectionChain(collectionIdsOrder, xAxis, yAxis, yName);
      const data = this.iterate(chain, documentsMap);
      return this.convertDocumentsMapData(data, config, baseCollection, chartYAxisType);
    }

    const documents = Object.values(documentsMap[baseCollection.id] || {});
    return this.convertSingleAxis(chartYAxisType, config.type, documents, baseCollection, xAxis, yAxis);
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
    let index = 0;
    let collectionIndex = xAxis.collectionIndex;
    const chain: CollectionChain[] = [
      {
        index: index++,
        collectionId: xAxis.collectionId,
        attributeId: xAxis.attributeId,
        asIdOfArray: !yName,
        asIdOfObject: !!yName,
      },
    ];

    if (yName) {
      const nameSubChain = this.createCollectionChainForRange(
        collectionIdsOrder,
        collectionIndex,
        yName.collectionIndex,
        index
      );
      chain.push(...nameSubChain);
      index += nameSubChain.length;

      chain.push({
        index: index++,
        collectionId: yName.collectionId,
        attributeId: yName.attributeId,
        asIdOfObject: true,
      });
      collectionIndex = yName.collectionIndex;
    }

    const axisSubChain = this.createCollectionChainForRange(
      collectionIdsOrder,
      collectionIndex,
      yAxis.collectionIndex,
      index
    );
    chain.push(...axisSubChain);
    index += axisSubChain.length;

    chain.push({index: index, collectionId: yAxis.collectionId, attributeId: yAxis.attributeId, asIdOfArray: true});

    return chain;
  }

  private createCollectionChainForRange(
    collectionIdsOrder: string[],
    startIndex: number,
    endIndex: number,
    stageIndex: number
  ): CollectionChain[] {
    const chain: CollectionChain[] = [];
    if (startIndex > endIndex) {
      for (let i = startIndex; i > endIndex; i--) {
        chain.push({index: stageIndex++, collectionId: collectionIdsOrder[i]});
      }
    } else {
      for (let i = startIndex; i < endIndex; i++) {
        chain.push({index: stageIndex++, collectionId: collectionIdsOrder[i]});
      }
    }

    return chain;
  }

  private iterate(chain: CollectionChain[], documentsMap: DocumentsMap): DocumentsData {
    const documents = Object.values(documentsMap[chain[0].collectionId] || {});
    const data = {};
    this.iterateRecursive(documents, {}, chain, 0, documentsMap);
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
    const forward = chain[index - 1].index < stage.index;
    if (index === chain.length - 1) {
      const values = documents.map(d => d.data[stage.attributeId]).filter(value => !!value);
      data.push(...values);
      return;
    }

    for (const document of documents) {
      const nextStage = chain[index + 1];
      const linkedDocuments = forward ? document.linksFrom : document.linksTo;
      const nextCollectionDocuments = documentsMap[nextStage.collectionId] || {};
      const linkedDocumentsWithLinks = linkedDocuments
        .filter(d => d.collectionId === stage.collectionId)
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
  ): ChartData {
    const xEntries = Object.keys(data);
    if (xEntries.length === 0) {
      return this.createEmptyData(config.type);
    }
    // TODO sort

    if (this.areDataNested(data, xEntries)) {
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
        const yValue = this.aggregate(config.aggregation, values);
        if (yValue) {
          isNumericMap[nestedKey] = isNumericMap[nestedKey] && this.isNumeric(yValue);
          pointsMap[nestedKey].push({x: key, y: yValue});
        }
      }
    }

    const sets: ChartDataSet[] = [];
    const legendEntries: ChartLegendEntry[] = [];
    const legendEntriesNames = Object.keys(pointsMap);
    let colorAlpha = 100;
    const colorAlphaStep = 60 / Math.max(1, legendEntriesNames.length - 1); // min alpha is 40

    for (let i = 0; i < legendEntriesNames.length; i++) {
      const name = legendEntriesNames[i];
      const color = hex2rgba(baseCollection.color, colorAlpha);
      legendEntries.push({color, value: name});
      sets.push({id: baseCollection.id, points: pointsMap[name], color, isNumeric: isNumericMap[name], yAxisType});
      colorAlpha -= colorAlphaStep;
    }

    return {sets, legend: {entries: legendEntries}, type: config.type};
  }

  private convertDocumentsMapDataSimple(
    data: DocumentsData,
    xEntries: string[],
    config: ChartConfig,
    baseCollection: Collection,
    yAxisType: ChartYAxisType
  ): ChartData {
    let isNumeric = true;
    const points: ChartPoint[] = [];
    for (const key of xEntries) {
      const values = data[key] as any[];
      const yValue = this.aggregate(config.aggregation, values);
      if (yValue) {
        isNumeric = isNumeric && this.isNumeric(yValue);
        points.push({x: key, y: yValue});
      }
    }

    const dataSet = {id: baseCollection.id, points, color: baseCollection.color, isNumeric, yAxisType};
    return {sets: [dataSet], legend: {entries: []}, type: config.type};
  }

  private areDataNested(data: DocumentsData, keys: string[]): boolean {
    const value = data[keys[0]];
    return !Array.isArray(value);
  }

  private aggregate(aggregation: ChartAggregation, values: any[]): any {
    if (values.length === 1) {
      return values[0];
    }

    switch (aggregation) {
      case ChartAggregation.Sum:
        return this.sumValues(values);
      case ChartAggregation.Avg:
        return this.avgValues(values);
      case ChartAggregation.Min:
        return this.minInValues(values);
      case ChartAggregation.Max:
        return this.maxInValues(values);
      default:
        return values[0];
    }
  }

  private sumValues(values: any[]): any {
    const numericValues = values.filter(value => this.isNumeric(value));
    return numericValues.reduce((sum, value) => sum + value, 0);
  }

  private avgValues(values: any[]): any {
    const numericValues = values.filter(value => this.isNumeric(value));
    if (numericValues.length === 0) {
      return null;
    }

    return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
  }

  private minInValues(values: any[]): any {
    const sortedValues = values.sort((a, b) => (a > b ? 1 : -1));
    return sortedValues[0];
  }

  private maxInValues(values: any[]): any {
    const sortedValues = values.sort((a, b) => (a > b ? -1 : 1));
    return sortedValues[0];
  }

  private convertSingleAxis(
    yAxisType: ChartYAxisType,
    type: ChartType,
    documents: DocumentModel[],
    collection: Collection,
    xAxis?: ChartAxis,
    yAxis?: ChartAxis
  ): ChartData {
    let isNumeric = true;

    const points: ChartPoint[] = [];
    for (const document of documents) {
      const xValue = xAxis && document.data[xAxis.attributeId];
      const yValue = yAxis && document.data[yAxis.attributeId];
      isNumeric = isNumeric && this.isNumeric(yValue);
      points.push({id: document.id, x: xValue, y: yValue});
    }

    const dataSet = {id: collection.id, points, color: collection.color, isNumeric, yAxisType};
    return {sets: [dataSet], legend: {entries: []}, type};
  }

  private mergeData(data1: ChartData, data2: ChartData): ChartData {
    return {
      sets: data1.sets.concat(data2.sets),
      legend: {entries: data1.legend.entries.concat(data2.legend.entries)},
      type: data1.type,
    };
  }

  private isNumeric(value: any): boolean {
    return !isNaN(value);
  }

  private createEmptyData(type: ChartType): ChartData {
    return {sets: [], legend: {entries: []}, type};
  }
}
