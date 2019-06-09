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

import {Injectable} from '@angular/core';
import {Constraint, ConstraintData} from '../../../core/model/data/constraint';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {LinkType} from '../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {Query} from '../../../core/store/navigation/query';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../core/model/resource';
import {isNullOrUndefined} from '../common.utils';
import {findAttributeConstraint} from '../../../core/store/collections/collection.util';
import {formatDataValue} from '../data.utils';
import {queryStemAttributesResourcesOrder} from '../../../core/store/navigation/query.util';

type DataResourceWithLinks = DataResource & {from: DataResource[]; to: DataResource[]};

interface AttributesResourceChain {
  resource: AttributesResource;
  index: number;
  attributeId?: string;
  isRow?: boolean;
  isColumn?: boolean;
}

// <resourceId, <docId/linkId, DataResourceWithLinks>>
type DataResourceMap = Record<string, Record<string, DataResourceWithLinks>>;

export interface AggregatedData {
  map: AggregatedDataMap;
  columnsMap: Record<string, any>;
  rowLevels: number;
  columnLevels: number;
}

// any represents AggregatedDataMap
export type AggregatedDataMap = Record<string, any | AggregatedDataValues[]>;

export interface AggregatedDataValues {
  resourceId: string;
  type: AttributesResourceType;
  objects: DataResource[];
}

export interface DataAggregatorAttribute {
  attributeId: string;
  resourceIndex: number;
}

@Injectable()
export class DataAggregator {
  private constraintData: ConstraintData;
  private attributesResourcesOrder: AttributesResource[];
  private dataMap: DataResourceMap = {};

  constructor(private formatValue?: (value: any, constraint: Constraint, data?: ConstraintData) => any) {}

  public updateData(
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    query: Query,
    constraintData?: ConstraintData
  ) {
    this.constraintData = constraintData;

    this.attributesResourcesOrder = queryStemAttributesResourcesOrder(
      query.stems && query.stems[0],
      collections,
      linkTypes
    );
    this.dataMap = createDataMap(this.attributesResourcesOrder, documents, linkTypes, linkInstances);
  }

  public getDataResources(index: number): DataResource[] {
    const resourceId = this.attributesResourceIdForIndex(index);
    const dataResourcesMap = this.dataMap[resourceId];
    return Object.values(dataResourcesMap || {});
  }

  public getNextCollectionResource(index: number): AttributesResource {
    if (this.attributesResourceTypeForIndex(index) === AttributesResourceType.LinkType) {
      return this.attributesResourcesOrder[index + 1];
    }
    return this.attributesResourcesOrder[index];
  }

  public aggregate(
    rowAttributes: DataAggregatorAttribute[],
    columnAttributes: DataAggregatorAttribute[],
    valueAttributes: DataAggregatorAttribute[]
  ) {
    if ((rowAttributes || []).length === 0 && (columnAttributes || []).length === 0) {
      return this.emptyAggregate();
    }

    return this.aggregateByRowsAndColumns(rowAttributes || [], columnAttributes || [], valueAttributes || []);
  }

  private emptyAggregate(): AggregatedData {
    return {map: {}, columnsMap: {}, rowLevels: 0, columnLevels: 0};
  }

  private aggregateByRowsAndColumns(
    rowAttributes: DataAggregatorAttribute[],
    columnAttributes: DataAggregatorAttribute[],
    valueAttributes: DataAggregatorAttribute[]
  ): AggregatedData {
    const {chain, valuesChains} = this.createAttributesResourceChain(rowAttributes, columnAttributes, valueAttributes);
    const map = this.iterate(chain, valuesChains);
    const columnsMap = this.createColumnsMap(map, rowAttributes.length, columnAttributes.length);
    return {map, columnsMap, rowLevels: rowAttributes.length, columnLevels: columnAttributes.length};
  }

  private createColumnsMap(fullMap: Record<string, any>, rowLevels: number, columnLevels: number): Record<string, any> {
    if (rowLevels === 0 || columnLevels === 0) {
      return {};
    }

    const map = {};
    const keys = Object.keys(fullMap);
    keys.forEach(key => this.iterateThroughColumnMap(fullMap[key], map, 1, rowLevels, rowLevels + columnLevels));
    return map;
  }

  private iterateThroughColumnMap(
    currentMap: Record<string, any>,
    columnMap: Record<string, any>,
    level: number,
    columnLevel: number,
    maxLevel: number
  ) {
    if (level >= maxLevel) {
      return;
    }

    Object.keys(currentMap).forEach(key => {
      if (level >= columnLevel) {
        if (!columnMap[key]) {
          columnMap[key] = {};
        }
        this.iterateThroughColumnMap(currentMap[key], columnMap[key], level + 1, columnLevel, maxLevel);
      } else {
        this.iterateThroughColumnMap(currentMap[key], columnMap, level + 1, columnLevel, maxLevel);
      }
    });
  }

  private createAttributesResourceChain(
    rowAttributes: DataAggregatorAttribute[],
    columnAttributes: DataAggregatorAttribute[],
    valueAttributes: DataAggregatorAttribute[]
  ): {chain: AttributesResourceChain[]; valuesChains: AttributesResourceChain[][]} {
    if ((this.attributesResourcesOrder || []).length === 0) {
      return {chain: [], valuesChains: []};
    }

    const chain: AttributesResourceChain[] = [];

    let index = -1;
    if (rowAttributes.length > 0) {
      chain.push(...this.createRowOrColumnAttributesChain(rowAttributes, true, false));
      index = rowAttributes[rowAttributes.length - 1].resourceIndex;
    }

    if (columnAttributes.length > 0) {
      if (index >= 0) {
        chain.push(...this.createAttributesResourceChainForRange(index, columnAttributes[0].resourceIndex));
      }
      chain.push(...this.createRowOrColumnAttributesChain(columnAttributes, false, true));
      index = columnAttributes[columnAttributes.length - 1].resourceIndex;
    }

    const valuesChains: AttributesResourceChain[][] = [];

    if (index >= 0) {
      const usedResourcesIndexes = new Set();
      for (const valueAttribute of valueAttributes) {
        if (usedResourcesIndexes.has(valueAttribute.resourceIndex)) {
          continue;
        }
        valuesChains.push(this.createValueAttributeChain(valueAttribute, index));

        usedResourcesIndexes.add(valueAttribute.resourceIndex);
      }
    }

    return {chain, valuesChains};
  }

  private createValueAttributeChain(
    valueAttribute: DataAggregatorAttribute,
    startIndex: number
  ): AttributesResourceChain[] {
    const chain = this.createAttributesResourceChainForRange(startIndex, valueAttribute.resourceIndex);
    chain.push({
      index: valueAttribute.resourceIndex,
      resource: this.attributesResourcesOrder[valueAttribute.resourceIndex],
      attributeId: valueAttribute.attributeId,
    });
    return chain;
  }

  private createRowOrColumnAttributesChain(
    aggregationAttributes: DataAggregatorAttribute[],
    isRow: boolean,
    isColumn: boolean
  ): AttributesResourceChain[] {
    const chain: AttributesResourceChain[] = [];
    let index = -1;
    for (let i = 0; i < aggregationAttributes.length; i++) {
      const aggregationAttribute = aggregationAttributes[i];
      index = aggregationAttribute.resourceIndex;
      chain.push({
        resource: this.attributesResourcesOrder[index],
        attributeId: aggregationAttribute.attributeId,
        index,
        isRow,
        isColumn,
      });

      const nextRowAttribute = aggregationAttributes[i + 1];
      if (nextRowAttribute) {
        chain.push(...this.createAttributesResourceChainForRange(index, nextRowAttribute.resourceIndex));
      }
    }

    return chain;
  }

  private createAttributesResourceChainForRange(startIndex: number, endIndex: number): AttributesResourceChain[] {
    const chain: AttributesResourceChain[] = [];
    if (startIndex > endIndex) {
      for (let i = startIndex - 1; i > endIndex; i--) {
        chain.push({index: i, resource: this.attributesResourcesOrder[i]});
      }
    } else {
      for (let i = startIndex + 1; i < endIndex; i++) {
        chain.push({index: i, resource: this.attributesResourcesOrder[i]});
      }
    }
    return chain;
  }

  private attributesResourceTypeForIndex(index: number): AttributesResourceType {
    if (index % 2 === 0) {
      // query stem order is created by this pattern: [Collection, Link, Collection, Link...]
      return AttributesResourceType.Collection;
    }
    return AttributesResourceType.LinkType;
  }

  private iterate(chain: AttributesResourceChain[], valuesChains: AttributesResourceChain[][]): AggregatedDataMap {
    if (chain.length === 0) {
      return {};
    }
    const resourceId = this.attributesResourceIdForIndex(chain[0].index);
    const dataObjects = Object.values(this.dataMap[resourceId] || {});
    const data = {};
    this.iterateRecursive(dataObjects, data, chain, valuesChains, 0);
    return data;
  }

  private iterateRecursive(
    objectData: DataResourceWithLinks[],
    data: AggregatedDataMap,
    chain: AttributesResourceChain[],
    valuesChains: AttributesResourceChain[][],
    index: number
  ) {
    const stage = chain[index];
    const constraint = findAttributeConstraint(stage.resource && stage.resource.attributes, stage.attributeId);

    for (const object of objectData) {
      const linkedObjectDataWithLinks = this.getLinkedObjectDataWithLinks(object, stage, chain[index + 1], object);

      if (stage.isRow || stage.isColumn) {
        const values = this.getValues(object, stage.attributeId);
        if (values.length === 0) {
          continue;
        }

        for (const value of values) {
          const formattedValue = this.formatAggregationValue(value, constraint);

          if (index === chain.length - 1) {
            if (valuesChains.length > 0) {
              for (const valueChain of valuesChains) {
                const valueLinkedObjectDataWithLinks = this.getLinkedObjectDataWithLinks(
                  object,
                  stage,
                  valueChain[0],
                  object
                );
                const lastStage = valueChain[valueChain.length - 1];
                const dataAggregationValues = this.processLastStage(lastStage, data, formattedValue);
                this.iterateThroughValues(valueLinkedObjectDataWithLinks, dataAggregationValues, valueChain, 0);
              }
            } else {
              this.processLastStage(stage, data, formattedValue);
            }
          } else {
            if (!data[formattedValue]) {
              data[formattedValue] = {};
            }
            this.iterateRecursive(linkedObjectDataWithLinks, data[formattedValue], chain, valuesChains, index + 1);
          }
        }
      } else {
        this.iterateRecursive(linkedObjectDataWithLinks, data, chain, valuesChains, index + 1);
      }
    }
  }

  private processLastStage(
    lastStage: AttributesResourceChain,
    data: AggregatedDataMap,
    formattedValue: string
  ): AggregatedDataValues {
    let dataAggregationValues: AggregatedDataValues = {
      resourceId: lastStage.resource.id,
      type: this.attributesResourceTypeForIndex(lastStage.index),
      objects: [],
    };
    if (data[formattedValue]) {
      const existingAggregationValues = data[formattedValue].find(
        v => v.resourceId === dataAggregationValues.resourceId && v.type === dataAggregationValues.type
      );
      if (existingAggregationValues) {
        dataAggregationValues = existingAggregationValues;
      } else {
        data[formattedValue].push(dataAggregationValues);
      }
    } else {
      data[formattedValue] = [dataAggregationValues];
    }

    return dataAggregationValues;
  }

  private getLinkedObjectDataWithLinks(
    object: DataResourceWithLinks,
    stage: AttributesResourceChain,
    nextStage: AttributesResourceChain,
    currentData: DataResourceWithLinks
  ): DataResourceWithLinks[] {
    if (!nextStage || nextStage.index === stage.index) {
      return [currentData];
    } else {
      const nextStageType = this.attributesResourceTypeForIndex(nextStage.index);
      const linkedObjectData = stage.index < nextStage.index ? object.from : object.to;

      const resourceId = this.attributesResourceIdForIndex(nextStage.index);
      const nextStageObjectData = this.dataMap[resourceId] || {};
      return linkedObjectData
        .filter(
          d =>
            ((<LinkInstance>d).linkTypeId &&
              (<LinkInstance>d).linkTypeId === nextStage.resource.id &&
              nextStageType === AttributesResourceType.LinkType) ||
            ((<DocumentModel>d).collectionId &&
              (<DocumentModel>d).collectionId === nextStage.resource.id &&
              nextStageType === AttributesResourceType.Collection)
        )
        .map(d => nextStageObjectData[d.id]);
    }
  }

  private attributesResourceIdForIndex(index: number): string {
    const type = this.attributesResourceTypeForIndex(index);
    const resource = this.attributesResourcesOrder[index];
    return attributesResourceId(type, resource.id);
  }

  private iterateThroughValues(
    objectData: DataResourceWithLinks[],
    values: AggregatedDataValues,
    valueChain: AttributesResourceChain[],
    index: number
  ) {
    if (index === valueChain.length - 1) {
      const objects = objectData.map(object => ({...object, from: null, to: null}));
      values.objects.push(...objects);
    } else {
      const stage = valueChain[index];
      for (const object of objectData) {
        const linkedObjectDataWithLinks = this.getLinkedObjectDataWithLinks(
          object,
          stage,
          valueChain[index + 1],
          object
        );
        this.iterateThroughValues(linkedObjectDataWithLinks, values, valueChain, index + 1);
      }
    }
  }

  private getValues(object: DataResource, attributeId: string): any[] {
    const value = object.data[attributeId];
    if (isNullOrUndefined(value)) {
      return [];
    }

    return Array.isArray(value) ? value : [value];
  }

  private formatAggregationValue(value: any, constraint: Constraint) {
    if (this.formatValue) {
      return this.formatValue(value, constraint, this.constraintData);
    }
    return formatDataValue(value, constraint, this.constraintData);
  }
}

function createDataMap(
  attributeResourcesOrder: AttributesResource[],
  documents: DocumentModel[],
  linkTypes: LinkType[],
  linkInstances: LinkInstance[]
): DataResourceMap {
  const idsOrderMap = attributeResourcesOrder.reduce(
    (idsMap, axisResource, index) => ({...idsMap, [axisResource.id]: index}),
    {}
  );
  const linkTypeIds = new Set((linkTypes || []).map(lt => lt.id));
  const allDocumentsMap: Record<string, DocumentModel> = {};
  const map: DataResourceMap = {};

  for (const document of documents) {
    allDocumentsMap[document.id] = document;
    const resourceId = collectionResourceId(document.collectionId);
    !map[resourceId] && (map[resourceId] = {});
    map[resourceId][document.id] = {...document, to: [], from: []};
  }

  for (const linkInstance of linkInstances || []) {
    const resourceId = linkTypeResourceId(linkInstance.linkTypeId);
    !map[resourceId] && (map[resourceId] = {});
    map[resourceId][linkInstance.id] = {...linkInstance, to: [], from: []};

    const document1 = allDocumentsMap[linkInstance.documentIds[0]];
    const document2 = allDocumentsMap[linkInstance.documentIds[1]];

    const document1Map = document1 && map[collectionResourceId(document1.collectionId)];
    const document2Map = document2 && map[collectionResourceId(document2.collectionId)];
    const linkInstanceMap = map[resourceId];

    if (!document1 || !document1Map || !document2 || !document2Map || !linkTypeIds.has(linkInstance.linkTypeId)) {
      continue;
    }

    const document1CollectionIndex = idsOrderMap[collectionResourceId(document1.collectionId)];
    const document2CollectionIndex = idsOrderMap[collectionResourceId(document2.collectionId)];
    const linkInstanceObjectData: DataResource = {
      id: linkInstance.id,
      data: linkInstance.data,
      linkTypeId: linkInstance.linkTypeId,
    };
    const document1ObjectData: DataResource = {
      id: document1.id,
      data: document1.data,
      collectionId: document1.collectionId,
    };
    const document2ObjectData: DataResource = {
      id: document2.id,
      data: document2.data,
      collectionId: document2.collectionId,
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

function collectionResourceId(id: string): string {
  return attributesResourceId(AttributesResourceType.Collection, id);
}

function linkTypeResourceId(id: string): string {
  return attributesResourceId(AttributesResourceType.LinkType, id);
}

function attributesResourceId(type: AttributesResourceType, id: string): string {
  return `${type}:${id}`;
}
