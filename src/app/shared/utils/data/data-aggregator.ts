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
import {getOtherLinkedCollectionId} from '../link-type.utils';
import {AttributeResourceType, AttributesResource, DataResource} from '../../../core/model/resource';
import {isNotNullOrUndefined} from '../common.utils';
import {findAttributeConstraint} from '../../../core/store/collections/collection.util';
import {formatDataValue} from '../data.utils';

interface DataResourceWithLinks extends DataResource {
  from: DataResource[];
  to: DataResource[];
}

interface AttributeResourceChain {
  resource: AttributesResource;
  type: AttributeResourceType;
  index: number;
  attributeId?: string;
  isRow?: boolean;
  isColumn?: boolean;

  isValueChain?: boolean;
  valueChain?: AttributeResourceChain[];
}

// <resourceId, <docId/linkId, DataResourceWithLinks>>
type DataResourceMap = Record<string, Record<string, DataResourceWithLinks>>;

export interface DataAggregation {
  map: DataAggregationMap;
  rowDistinctKeys: any[][];
  columnDistinctKeys: any[][];
}

// any represents DataAggregationMap
export type DataAggregationMap = Record<string, any | DataAggregationValues>;

export interface DataAggregationValues {
  resourceId: string;
  type: AttributeResourceType;
  objects: DataResource[];
}

export interface DataAggregationAttribute {
  attributeId: string;
  resourceIndex: number;
}

@Injectable()
export class DataAggregator {

  private constraintData: ConstraintData;
  private dataMap: DataResourceMap;

  constructor(
    private formatValue?: (value: any, constraint: Constraint, data?: ConstraintData) => any,
  ) {
  }

  public updateData(
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    query: Query,
    constraintData?: ConstraintData,
  ) {
    this.constraintData = constraintData;

    const attributeResourcesOrder = createAttributeResourcesOrder(query, collections, linkTypes);
    this.dataMap = createDataMap(attributeResourcesOrder, documents, linkTypes, linkInstances);
  }

  public aggregate(rowAttributes: DataAggregationAttribute[],
                   columnAttributes: DataAggregationAttribute[],
                   valueAttributes: DataAggregationAttribute[]) {

    if ((rowAttributes || []).length === 0 && (columnAttributes || []).length === 0) {
      return this.emptyAggregate();
    }

    return this.aggregateByRowsAndColumns(rowAttributes || [], columnAttributes || [], valueAttributes || []);
  }

  private emptyAggregate(): DataAggregation {
    return {map: {}, rowDistinctKeys: [], columnDistinctKeys: []};
  }

  private aggregateByRowsAndColumns(rowAttributes: DataAggregationAttribute[],
                                    columnAttributes: DataAggregationAttribute[],
                                    valueAttributes: DataAggregationAttribute[]): DataAggregation {

    return null;
  }

  private createAttributeResourceChain(
    attributeResourcesOrder: AttributesResource[],
  ) {
    // TODO
  }

  private iterateRecursive(
    objectData: DataResourceWithLinks[],
    data: DataAggregationMap,
    chain: AttributeResourceChain[],
    index: number,
    dataMap: DataResourceMap
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
        .filter(d => (d.linkTypeId && d.linkTypeId === nextStage.resource.id && nextStage.type === AttributeResourceType.LinkType)
        || (d.collectionId && d.collectionId === nextStage.resource.id && nextStage.type === AttributeResourceType.Collection))
        .map(d => nextStageObjectData[d.id]);

      if (stage.isRow || stage.isColumn) {
        const values = this.getValues(object, stage.attributeId);
        if (values.length === 0) {
          continue;
        }

        for (const value of values) {
          const formattedValue = this.formatAggregationValue(value, constraint);
          if (!data[formattedValue]) {
            data[formattedValue] = stage.isValueChain ? [] : {};
          }
          this.iterateRecursive(linkedObjectDataWithLinks, data[value], chain, index + 1, dataMap);
        }
      } else {
        this.iterateRecursive(linkedObjectDataWithLinks, data, chain, index + 1, dataMap);
      }
    }
  }

  private getValues(object: DataResource, attributeId: string): any[] {
    const value = object.data[attributeId];
    if (!value) {
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

function createAttributeResourcesOrder(query: Query, collections: Collection[], linkTypes: LinkType[]): AttributesResource[] {
  const stem = query.stems[0];
  const baseCollection = collections.find(collection => collection.id === stem.collectionId);
  const chain: AttributesResource[] = [
    {
      id: collectionResourceId(baseCollection.id),
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
      chain.push({id: linkTypeResourceId(linkType.id), attributes: linkType.attributes, color: otherCollection.color});
      chain.push({
        id: collectionResourceId(otherCollection.id),
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

function createDataMap(attributeResourcesOrder: AttributesResource[], documents: DocumentModel[], linkTypes: LinkType[], linkInstances: LinkInstance[]): DataResourceMap {
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
    map[resourceId][document.id] = {...document, to: [], from: [],};
  }

  for (const linkInstance of linkInstances || []) {
    const resourceId = linkTypeResourceId(linkInstance.linkTypeId);
    !map[resourceId] && (map[resourceId] = {});
    map[resourceId][linkInstance.id] = {...linkInstance, to: [], from: [],};

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
  return axisResourceId(AttributeResourceType.Collection, id);
}

function linkTypeResourceId(id: string): string {
  return axisResourceId(AttributeResourceType.LinkType, id);
}

function axisResourceId(type: AttributeResourceType, id: string): string {
  return `${type}:${id}`;
}
