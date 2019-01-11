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
import {ChartAxis, ChartAxisType, ChartConfig, ChartType} from '../../../../core/store/charts/chart';
import {ChartData, ChartPoint, ChartYAxisType} from './chart-data';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {Query} from '../../../../core/store/navigation/query';
import {queryStemCollectionsOrder} from '../../../../core/store/navigation/query.util';

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

export class DataConvertor {
  private documentsMap: Record<string, Record<string, DocumentWithLinks>>;

  public convert(
    config: ChartConfig,
    documents: DocumentModel[],
    collections: Collection[],
    query: Query,
    linkTypes: LinkType[],
    linkInstances: LinkInstance[]
  ): ChartData {
    const collectionIdsOrder = queryStemCollectionsOrder(linkTypes, query.stems && query.stems[0]);
    this.documentsMap = this.createDocumentsMap(collectionIdsOrder, documents, linkTypes, linkInstances);

    return this.createEmptyData(config.type);
  }

  private createCollectionChain(
    collectionIdsOrder: string[],
    xAxis: ChartAxis,
    yAxis: ChartAxis,
    axisName?: ChartAxis
  ): CollectionChain[] {
    let index = 0;
    let collectionIndex = xAxis.collectionIndex;
    const chain: CollectionChain[] = [
      {
        index: index++,
        collectionId: xAxis.collectionId,
        attributeId: xAxis.attributeId,
        asIdOfArray: !axisName,
        asIdOfObject: !!axisName,
      },
    ];

    if (axisName) {
      const nameSubChain = this.createCollectionChainForRange(
        collectionIdsOrder,
        collectionIndex,
        axisName.collectionIndex,
        index
      );
      chain.push(...nameSubChain);
      index += nameSubChain.length;

      chain.push({
        index: index++,
        collectionId: axisName.collectionId,
        attributeId: axisName.attributeId,
        asIdOfObject: true,
      });
      collectionIndex = axisName.collectionIndex;
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

  /*
   * Structure of data is:
   *  {key1: {key2 .... : {keyN: []} ... } where key is used for group data and array for data aggregation
   *  if dataset name is set N = 2; else N = 1
   */
  private iterate(chain: CollectionChain[]): any {
    const documents = Object.values(this.documentsMap[chain[0].collectionId] || {});
    const data = {};
    this.iterateRecursive(documents, {}, chain, 0);
    return data;
  }

  private iterateRecursive(documents: DocumentWithLinks[], data: any, chain: CollectionChain[], index: number) {
    const stage = chain[index];
    const forward = chain[index - 1].index < stage.index;
    if (index === chain.length - 1) {
      const values = documents.map(d => d.data[stage.attributeId]).filter(value => !!value);
      data.push(...values);
      return;
    }

    for (const document of documents) {
      const value = document.data[stage.attributeId];
      if (!value) {
        // TODO what if array?
        continue;
      }

      const nextStage = chain[index + 1];
      const linkedDocuments = forward ? document.linksFrom : document.linksTo;
      const nextCollectionDocuments = this.documentsMap[nextStage.collectionId] || {};
      const linkedDocumentsWithLinks = linkedDocuments
        .filter(d => d.collectionId === stage.collectionId)
        .map(d => nextCollectionDocuments[d.id]);

      let nextData: any;
      if (stage.asIdOfArray || stage.asIdOfObject) {
        const dataValue = document.data[stage.attributeId];
        if (!data[dataValue]) {
          data[dataValue] = stage.asIdOfArray ? [] : {};
        }
        nextData = data[dataValue];
      } else {
        nextData = data;
      }

      this.iterateRecursive(linkedDocumentsWithLinks, nextData, chain, index + 1);
    }
  }

  private createDocumentsMap(
    collectionIdsOrder: string[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[]
  ): Record<string, Record<string, DocumentWithLinks>> {
    const collectionIdsOrderMap = collectionIdsOrder.reduce((idsMap, id, index) => ({...idsMap, [id]: index}), {});
    const linkTypeIds = new Set(linkTypes.map(lt => lt.id));
    const allDocumentsMap: Record<string, DocumentModel> = {};
    const map: Record<string, Record<string, DocumentWithLinks>> = {};

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

  public convertSingleCollection(config: ChartConfig, documents: DocumentModel[], collection: Collection): ChartData {
    if (!collection || !config || !documents) {
      return this.createEmptyData(config.type);
    }

    const xAxis = config.axes[ChartAxisType.X];
    const y1Axis = config.axes[ChartAxisType.Y1];
    const y2Axis = config.axes[ChartAxisType.Y2];

    if (y1Axis && y2Axis) {
      const data = this.convertSingleAxis(ChartYAxisType.Y1, config.type, documents, collection, xAxis, y1Axis);
      const data2 = this.convertSingleAxis(ChartYAxisType.Y2, config.type, documents, collection, xAxis, y2Axis);
      return this.mergeData(data, data2);
    } else if (!y1Axis && (xAxis || y2Axis)) {
      return this.convertSingleAxis(ChartYAxisType.Y2, config.type, documents, collection, xAxis, y2Axis);
    } else if (xAxis || y1Axis) {
      return this.convertSingleAxis(ChartYAxisType.Y1, config.type, documents, collection, xAxis, y1Axis);
    }

    return this.createEmptyData(config.type);
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

  public createEmptyData(type: ChartType): ChartData {
    return {sets: [], legend: {entries: []}, type};
  }
}
