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

import {Constraint} from '../../../core/model/constraint';
import {UnknownConstraint} from '../../../core/model/constraint/unknown.constraint';
import {ConstraintData} from '../../../core/model/data/constraint';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../core/model/resource';
import {Collection} from '../../../core/store/collections/collection';
import {findAttributeConstraint} from '../../../core/store/collections/collection.util';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../core/store/link-types/link.type';
import {QueryStem} from '../../../core/store/navigation/query/query';
import {queryStemAttributesResourcesOrder} from '../../../core/store/navigation/query/query.util';
import {isArray, isNotNullOrUndefined, isNullOrUndefined} from '../common.utils';

type DataResourceWithLinks = DataResource & {from: DataResource[]; to: DataResource[]};

interface AttributesResourceChain {
  resource: AttributesResource;
  index: number;
  attributeId?: string;
  data?: any;
  isRow?: boolean;
  isColumn?: boolean;
  unique?: boolean;
}

// <resourceId, <docId/linkId, DataResourceWithLinks>>
type DataResourceMap = Record<string, Record<string, DataResourceWithLinks>>;

export interface AggregatedMapData {
  map: AggregatedDataMap;
  columnsMap: Record<string, any>;
  rowLevels: number;
  columnLevels: number;
}

export interface AggregatedArrayData {
  items: AggregatedDataItem[];
  levels: number;
}

export interface AggregatedDataItem {
  value: any;
  dataResources: DataResource[];
  dataResourcesChains: DataResourceChain[][];
  children?: AggregatedDataItem[];
  values?: AggregatedDataValues[];
}

export interface DataResourceChain {
  documentId?: string;
  linkInstanceId?: string;
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
  data?: any;
  unique?: boolean;
}

export class DataAggregator {
  private constraintData: ConstraintData;
  private attributesResourcesOrder: AttributesResource[];
  private dataMap: DataResourceMap = {};

  constructor(
    private formatValue?: (
      value: any,
      constraint: Constraint,
      data: ConstraintData,
      aggregatorAttribute: DataAggregatorAttribute
    ) => any
  ) {}

  public updateData(
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    queryStem: QueryStem,
    constraintData?: ConstraintData
  ) {
    this.constraintData = constraintData;

    this.attributesResourcesOrder = queryStemAttributesResourcesOrder(queryStem, collections, linkTypes);
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
  ): AggregatedMapData {
    if ((rowAttributes || []).length === 0 && (columnAttributes || []).length === 0) {
      return {map: {}, columnsMap: {}, rowLevels: 0, columnLevels: 0};
    }

    return this.aggregateByRowsAndColumns(rowAttributes || [], columnAttributes || [], valueAttributes || []);
  }

  public aggregateArray(
    attributes: DataAggregatorAttribute[],
    valueAttributes: DataAggregatorAttribute[]
  ): AggregatedArrayData {
    if ((attributes || []).length === 0) {
      return {items: [], levels: 0};
    }

    return this.aggregateByArray(attributes, valueAttributes);
  }

  private aggregateByArray(
    attributes: DataAggregatorAttribute[],
    valueAttributes: DataAggregatorAttribute[]
  ): AggregatedArrayData {
    const {chain, valuesChains} = this.createAttributesResourceChain(attributes, [], valueAttributes);
    const items = this.iterateArray(chain, valuesChains);
    return {items, levels: attributes.length};
  }

  private aggregateByRowsAndColumns(
    rowAttributes: DataAggregatorAttribute[],
    columnAttributes: DataAggregatorAttribute[],
    valueAttributes: DataAggregatorAttribute[]
  ): AggregatedMapData {
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
        data: aggregationAttribute.data,
        index,
        isRow,
        isColumn,
        unique: aggregationAttribute.unique,
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
    const chainVisitedIds = [];
    this.iterateRecursive(dataObjects, data, chain, valuesChains, 0, chainVisitedIds);
    return data;
  }

  private iterateRecursive(
    objectData: DataResourceWithLinks[],
    data: AggregatedDataMap,
    chain: AttributesResourceChain[],
    valuesChains: AttributesResourceChain[][],
    index: number,
    chainVisitedIds: string[]
  ) {
    const stage = chain[index];
    const constraint = findAttributeConstraint(stage.resource && stage.resource.attributes, stage.attributeId);

    for (const object of objectData) {
      chainVisitedIds[index] = object.id;
      const linkedObjectDataWithLinks = this.getLinkedObjectDataWithLinks(object, chain, index, chainVisitedIds);

      if (stage.isRow || stage.isColumn) {
        const values = this.getValues(object, stage.attributeId);
        if (values.length === 0) {
          continue;
        }

        for (const value of values) {
          let formattedValue = this.formatAggregationValue(value, constraint, {
            resourceIndex: stage.index,
            attributeId: stage.attributeId,
            data: stage.data,
          });
          formattedValue = isNotNullOrUndefined(formattedValue) ? formattedValue : '';

          if (index === chain.length - 1) {
            if (valuesChains.length > 0) {
              for (const valueChain of valuesChains) {
                const fullChain = [...chain, ...valueChain];
                const valueLinkedObjectDataWithLinks = this.getLinkedObjectDataWithLinks(
                  object,
                  fullChain,
                  index,
                  chainVisitedIds
                );
                const lastStage = valueChain[valueChain.length - 1];
                const dataAggregationValues = this.processLastStage(lastStage, data, formattedValue);
                this.iterateThroughValues(
                  valueLinkedObjectDataWithLinks,
                  dataAggregationValues,
                  fullChain,
                  index + 1,
                  chainVisitedIds
                );
              }
            } else {
              this.processLastStage(stage, data, formattedValue);
            }
          } else {
            if (!data[formattedValue]) {
              data[formattedValue] = {};
            }
            this.iterateRecursive(
              linkedObjectDataWithLinks,
              data[formattedValue],
              chain,
              valuesChains,
              index + 1,
              chainVisitedIds
            );
          }
        }
      } else {
        this.iterateRecursive(linkedObjectDataWithLinks, data, chain, valuesChains, index + 1, chainVisitedIds);
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

  private iterateArray(
    chain: AttributesResourceChain[],
    valuesChains: AttributesResourceChain[][]
  ): AggregatedDataItem[] {
    if (chain.length === 0) {
      return [];
    }
    const resourceId = this.attributesResourceIdForIndex(chain[0].index);
    const dataObjects = Object.values(this.dataMap[resourceId] || {});
    const items = [];
    const chainVisitedIds = [];
    this.iterateRecursiveArray(dataObjects, items, chain, valuesChains, 0, chainVisitedIds, []);
    return items;
  }

  private iterateRecursiveArray(
    objectData: DataResourceWithLinks[],
    items: AggregatedDataItem[],
    chain: AttributesResourceChain[],
    valuesChains: AttributesResourceChain[][],
    index: number,
    chainVisitedIds: string[],
    dataResourcesChain: DataResourceChain[]
  ) {
    const stage = chain[index];
    const constraint = findAttributeConstraint(stage.resource && stage.resource.attributes, stage.attributeId);

    for (const object of objectData) {
      chainVisitedIds[index] = object.id;
      const linkedObjectDataWithLinks = this.getLinkedObjectDataWithLinks(object, chain, index, chainVisitedIds);

      if (stage.isRow || stage.isColumn) {
        const values = this.getValues(object, stage.attributeId);
        if (values.length === 0) {
          continue;
        }

        for (const value of values) {
          let formattedValue = this.formatAggregationValue(value, constraint, {
            resourceIndex: stage.index,
            attributeId: stage.attributeId,
            data: stage.data,
          });
          formattedValue = isNotNullOrUndefined(formattedValue) ? formattedValue : '';

          if (index === chain.length - 1) {
            if (valuesChains.length > 0) {
              for (const valueChain of valuesChains) {
                const fullChain = [...chain, ...valueChain];
                const valueLinkedObjectDataWithLinks = this.getLinkedObjectDataWithLinks(
                  object,
                  fullChain,
                  index,
                  chainVisitedIds
                );
                const lastStage = valueChain[valueChain.length - 1];
                const dataAggregationValues = this.processLastStageArray(
                  lastStage,
                  items,
                  formattedValue,
                  object,
                  dataResourcesChain
                );
                this.iterateThroughValues(
                  valueLinkedObjectDataWithLinks,
                  dataAggregationValues,
                  fullChain,
                  index + 1,
                  chainVisitedIds
                );
              }
            } else {
              this.processLastStageArray(stage, items, formattedValue, object, dataResourcesChain);
            }
          } else {
            const stageItem = this.findStageItemArray(items, formattedValue, stage, object, dataResourcesChain);
            this.iterateRecursiveArray(
              linkedObjectDataWithLinks,
              stageItem.children,
              chain,
              valuesChains,
              index + 1,
              chainVisitedIds,
              []
            );
          }
        }
      } else {
        const newChain = this.concatDataResourceChain(stage, dataResourcesChain, object);
        this.iterateRecursiveArray(
          linkedObjectDataWithLinks,
          items,
          chain,
          valuesChains,
          index + 1,
          chainVisitedIds,
          newChain
        );
      }
    }
  }

  private concatDataResourceChain(
    stage: AttributesResourceChain,
    dataResourcesChain: DataResourceChain[],
    object: DataResourceWithLinks
  ): DataResourceChain[] {
    const resourceType = this.attributesResourceTypeForIndex(stage.index);
    if (resourceType === AttributesResourceType.Collection) {
      return [...dataResourcesChain, {documentId: object.id}];
    } else if (resourceType === AttributesResourceType.LinkType) {
      return [...dataResourcesChain, {linkInstanceId: object.id}];
    }
    return [...dataResourcesChain, {}];
  }

  private findStageItemArray(
    items: AggregatedDataItem[],
    value: any,
    stage: AttributesResourceChain,
    object: DataResourceWithLinks,
    dataResourcesChain: DataResourceChain[]
  ): AggregatedDataItem {
    const stageItem = items.find(item => item.value === value && !stage.unique);
    const newChain = this.concatDataResourceChain(stage, dataResourcesChain, object);
    if (stageItem) {
      stageItem.dataResources.push(convertToDataResource(object));
      stageItem.dataResourcesChains.push(newChain);
      return stageItem;
    }

    const newStageItem = {
      value,
      dataResources: object ? [convertToDataResource(object)] : [],
      dataResourcesChains: [newChain || []],
      children: [],
    };
    items.push(newStageItem);
    return newStageItem;
  }

  private processLastStageArray(
    lastStage: AttributesResourceChain,
    items: AggregatedDataItem[],
    formattedValue: string,
    object: DataResourceWithLinks,
    dataResourcesChain: DataResourceChain[]
  ): AggregatedDataValues {
    let dataAggregationValues: AggregatedDataValues = {
      resourceId: lastStage.resource.id,
      type: this.attributesResourceTypeForIndex(lastStage.index),
      objects: [],
    };

    const stageItem = this.findStageItemArray(items, formattedValue, lastStage, object, dataResourcesChain);
    const existingAggregationValues = (stageItem.values || []).find(
      v => v.resourceId === dataAggregationValues.resourceId && v.type === dataAggregationValues.type
    );
    if (existingAggregationValues) {
      dataAggregationValues = existingAggregationValues;
    } else if (stageItem.values) {
      stageItem.values.push(dataAggregationValues);
    } else {
      stageItem.values = [dataAggregationValues];
    }

    return dataAggregationValues;
  }

  private getLinkedObjectDataWithLinks(
    object: DataResourceWithLinks,
    chain: AttributesResourceChain[],
    index: number,
    chainVisitedIds: string[]
  ): DataResourceWithLinks[] {
    const stage = chain[index];
    const nextStage = chain[index + 1];

    if (!nextStage || nextStage.index === stage.index) {
      return [object];
    } else {
      const nextStageType = this.attributesResourceTypeForIndex(nextStage.index);
      const linkedDataResources = stage.index < nextStage.index ? object.from : object.to;

      const resourceId = this.attributesResourceIdForIndex(nextStage.index);
      const nextStageDataResourcesWithLinks = this.dataMap[resourceId] || {};
      const mandatoryVisitedId = this.getMandatoryVisitedId(
        chain,
        index,
        chainVisitedIds,
        stage.index,
        nextStage.index
      );

      return linkedDataResources
        .filter(dataResource =>
          !!mandatoryVisitedId
            ? dataResource.id === mandatoryVisitedId
            : ((<LinkInstance>dataResource).linkTypeId &&
                (<LinkInstance>dataResource).linkTypeId === nextStage.resource.id &&
                nextStageType === AttributesResourceType.LinkType) ||
              ((<DocumentModel>dataResource).collectionId &&
                (<DocumentModel>dataResource).collectionId === nextStage.resource.id &&
                nextStageType === AttributesResourceType.Collection)
        )
        .map(dataResource => nextStageDataResourcesWithLinks[dataResource.id]);
    }
  }

  private getMandatoryVisitedId(
    chain: AttributesResourceChain[],
    chainIndex: number,
    chainVisitedIds: string[],
    fromIndex: number,
    toIndex: number
  ): string {
    if (fromIndex % 2 !== 0 || toIndex % 2 !== 1) {
      // path doesn't go from document to link
      return null;
    }

    for (let i = chainIndex; i >= 1; i--) {
      if (chain[i].index === fromIndex && chain[i - 1].index === toIndex) {
        return chainVisitedIds[i - 1];
      }
    }

    return null;
  }

  private attributesResourceIdForIndex(index: number): string {
    const type = this.attributesResourceTypeForIndex(index);
    const resource = this.attributesResourcesOrder[index];
    return attributesResourceId(type, resource.id);
  }

  private iterateThroughValues(
    objectData: DataResourceWithLinks[],
    values: AggregatedDataValues,
    chain: AttributesResourceChain[],
    index: number,
    chainVisitedIds: string[]
  ) {
    if (index === chain.length - 1) {
      values.objects.push(...objectData.map(object => convertToDataResource(object)));
    } else {
      for (const object of objectData) {
        chainVisitedIds[index] = object.id;
        const linkedObjectDataWithLinks = this.getLinkedObjectDataWithLinks(object, chain, index, chainVisitedIds);
        this.iterateThroughValues(linkedObjectDataWithLinks, values, chain, index + 1, chainVisitedIds);
      }
    }
  }

  private getValues(object: DataResource, attributeId: string): any[] {
    const value = object.data[attributeId];
    if (isNullOrUndefined(value)) {
      return [''];
    }

    return isArray(value) ? value : [value];
  }

  private formatAggregationValue(value: any, constraint: Constraint, attribute: DataAggregatorAttribute) {
    if (this.formatValue) {
      return this.formatValue(value, constraint, this.constraintData, attribute);
    }
    return (constraint || new UnknownConstraint()).createDataValue(value, this.constraintData).preview();
  }
}

function createDataMap(
  attributeResourcesOrder: AttributesResource[],
  documents: DocumentModel[],
  linkTypes: LinkType[],
  linkInstances: LinkInstance[]
): DataResourceMap {
  const idsOrderMap = attributeResourcesOrder.reduce((idsMap, axisResource, index) => {
    idsMap[attributesResourceIdByIndex(axisResource, index)] = index;
    return idsMap;
  }, {});
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

    if (document1CollectionIndex > document2CollectionIndex) {
      if (!dataResourcesContainsResource(document1Map[document1.id].to, linkInstanceObjectData)) {
        document1Map[document1.id].to.push(linkInstanceObjectData);
      }
      if (!dataResourcesContainsResource(document2Map[document2.id].from, linkInstanceObjectData)) {
        document2Map[document2.id].from.push(linkInstanceObjectData);
      }
      linkInstanceMap[linkInstance.id].to.push(document2ObjectData);
      linkInstanceMap[linkInstance.id].from.push(document1ObjectData);
    } else {
      if (!dataResourcesContainsResource(document2Map[document2.id].to, linkInstanceObjectData)) {
        document2Map[document2.id].to.push(linkInstanceObjectData);
      }
      if (!dataResourcesContainsResource(document1Map[document1.id].from, linkInstanceObjectData)) {
        document1Map[document1.id].from.push(linkInstanceObjectData);
      }
      linkInstanceMap[linkInstance.id].to.push(document1ObjectData);
      linkInstanceMap[linkInstance.id].from.push(document2ObjectData);
    }
  }
  return map;
}

function dataResourcesContainsResource(dataResources: DataResource[], dataResource: DataResource): boolean {
  return dataResources.some(dr => dr.id === dataResource.id);
}

function attributesResourceIdByIndex(resource: AttributesResource, index: number): string {
  if (index % 2 === 0) {
    // order is defined by query stem -> Collection, LinkType, Collection, .....
    return collectionResourceId(resource.id);
  }
  return linkTypeResourceId(resource.id);
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

function convertToDataResource(dataResourceWithLinks: DataResourceWithLinks): DataResource {
  const copy: DataResourceWithLinks = {...dataResourceWithLinks};
  delete copy.from;
  delete copy.to;
  return copy;
}
