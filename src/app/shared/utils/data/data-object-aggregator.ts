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
import {ConstraintData, ConstraintType} from '../../../core/model/data/constraint';
import {
  AggregatedDataItem,
  AggregatedDataValues,
  DataAggregator,
  DataAggregatorAttribute,
  DataResourceChain,
} from './data-aggregator';
import {Collection} from '../../../core/store/collections/collection';
import {DocumentModel} from '../../../core/store/documents/document.model';
import {LinkType} from '../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../core/store/link-instances/link.instance';
import {Query, QueryStem} from '../../../core/store/navigation/query/query';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../core/model/resource';
import {QueryAttribute, queryAttributePermissions} from '../../../core/model/query-attribute';
import {deepObjectCopy, objectsByIdMap} from '../common.utils';
import {SelectConstraint} from '../../../core/model/constraint/select.constraint';
import {ColorConstraint} from '../../../core/model/constraint/color.constraint';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {
  findAttributeConstraint,
  isCollectionAttributeEditable,
  isLinkTypeAttributeEditable,
} from '../../../core/store/collections/collection.util';
import {UnknownConstraint} from '../../../core/model/constraint/unknown.constraint';

export interface DataObjectInfo<T> {
  objectDataResources: Record<DataObjectInfoKey, DataResource>;
  metaDataResources: Record<DataObjectInfoKey, DataResource[]>;
  dataResourcesChain: DataResourceChain[];
  groupingDataResources: DataResource[];
  groupingObjects: T[];
}

export type DataObjectInfoKey = string;

export interface DataObjectAttribute extends QueryAttribute {
  key?: DataObjectInfoKey;
}

export interface DataObjectInput<T> {
  groupingAttributes: DataObjectAttribute[];
  objectAttributes: DataObjectAttribute[];
  metaAttributes: DataObjectAttribute[];
  objectsConverter?: (value: any, attribute: DataObjectAttribute) => T;
}

export class DataObjectAggregator<T> {
  private collectionsMap: Record<string, Collection>;
  private linkTypesMap: Record<string, LinkType>;
  private permissions: Record<string, AllowedPermissions>;
  private query: Query;

  private dataAggregator: DataAggregator;

  constructor(
    private formatValue?: (
      value: any,
      constraint: Constraint,
      data: ConstraintData,
      aggregatorAttribute: DataAggregatorAttribute
    ) => any
  ) {
    this.dataAggregator = new DataAggregator(formatValue);
  }

  public updateData(
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    queryStem: QueryStem,
    permissions: Record<string, AllowedPermissions>,
    constraintData?: ConstraintData
  ) {
    this.dataAggregator.updateData(collections, documents, linkTypes, linkInstances, queryStem, constraintData);
    this.collectionsMap = objectsByIdMap(collections);
    this.linkTypesMap = objectsByIdMap(linkTypes);
    this.permissions = permissions;
    this.query = {stems: [queryStem]};
  }

  public convert(input: DataObjectInput<T>, uniqueObjects = false): DataObjectInfo<T>[] {
    const aggregatorAttributes = [
      ...input.groupingAttributes.map(attribute => this.convertQueryAttribute(attribute, !uniqueObjects)),
      ...input.objectAttributes.map(attribute => this.convertQueryAttribute(attribute, !uniqueObjects)),
    ];

    const valueAttributes = [...input.metaAttributes.map(attribute => this.convertQueryAttribute(attribute, false))];

    const aggregatedData = this.dataAggregator.aggregateArray(aggregatorAttributes, valueAttributes);

    const dataObjectsInfo = [];
    const dataResourcesChain = [];

    this.fillByAggregationRecursive(aggregatedData.items, input, 0, dataResourcesChain, dataObjectsInfo, [], []);

    return dataObjectsInfo;
  }

  private fillByAggregationRecursive(
    items: AggregatedDataItem[],
    input: DataObjectInput<T>,
    level: number,
    dataResourcesChain: DataResourceChain[],
    dataObjectsInfo: DataObjectInfo<T>[],
    groupingObjects: T[],
    groupingDataResources: DataResource[]
  ) {
    if (level === input.groupingAttributes.length) {
      const dataObjectInfo: DataObjectInfo<T> = {
        groupingObjects,
        groupingDataResources,
        dataResourcesChain,
        metaDataResources: {},
        objectDataResources: {},
      };
      this.fillDataObjectInfo(items, input, 0, dataObjectInfo, dataObjectsInfo);
      return;
    }

    const attribute = input.groupingAttributes[level];
    for (const item of items) {
      const groupingObject = input.objectsConverter?.(item.value, attribute);
      this.fillByAggregationRecursive(
        item.children,
        input,
        level + 1,
        [...dataResourcesChain, ...item.dataResourcesChains[0]],
        dataObjectsInfo,
        [...groupingObjects, groupingObject],
        [...groupingDataResources, item.dataResources[0]] // we know that there is only one data resource because of unique aggregation
      );
    }
  }

  private fillDataObjectInfo(
    items: AggregatedDataItem[],
    input: DataObjectInput<T>,
    level: number,
    dataObjectInfo: DataObjectInfo<T>,
    dataObjectsInfo: DataObjectInfo<T>[]
  ) {
    const attribute = input.objectAttributes[level];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const dataResource = item.dataResources[0];

      const dataResourcesChain =
        level === 0
          ? [...dataObjectInfo.dataResourcesChain, ...item.dataResourcesChains[0]]
          : dataObjectInfo.dataResourcesChain;
      const nextDataObjectInfo: DataObjectInfo<T> = {
        ...deepObjectCopy(dataObjectInfo),
        dataResourcesChain,
        objectDataResources: {...dataObjectInfo.objectDataResources, [attribute.key]: dataResource},
      };

      if (level + 1 === input.objectAttributes.length) {
        this.fillDataObjectInfoMeta(item.values || [], input, nextDataObjectInfo, dataObjectsInfo);
      } else {
        this.fillDataObjectInfo(item.children, input, level + 1, nextDataObjectInfo, dataObjectsInfo);
      }
    }
  }

  private fillDataObjectInfoMeta(
    values: AggregatedDataValues[],
    input: DataObjectInput<T>,
    dataObjectInfo: DataObjectInfo<T>,
    dataObjectsInfo: DataObjectInfo<T>[]
  ) {
    const dataObjectInfoCopy = deepObjectCopy(dataObjectInfo);
    for (let i = 0; i < input.metaAttributes.length; i++) {
      const attribute = input.metaAttributes[i];

      const aggregatedDataValue = values.find(
        value => value.resourceId === attribute.resourceId && value.type === attribute.resourceType
      );
      dataObjectInfoCopy.metaDataResources[attribute.key] = aggregatedDataValue?.objects || [];
    }

    dataObjectsInfo.push(dataObjectInfoCopy);
  }

  public getDataResources(attribute: QueryAttribute): DataResource[] {
    return this.dataAggregator.getDataResources(attribute?.resourceIndex);
  }

  public getNextCollectionResource(index: number): AttributesResource {
    return this.dataAggregator.getNextCollectionResource(index);
  }

  public getPreviousCollectionResource(index: number): AttributesResource {
    return this.dataAggregator.getPreviousCollectionResource(index);
  }

  public getResource(model: QueryAttribute): AttributesResource {
    if (model.resourceType === AttributesResourceType.Collection) {
      return this.collectionsMap[model.resourceId];
    } else if (model.resourceType === AttributesResourceType.LinkType) {
      return this.linkTypesMap[model.resourceId];
    }

    return null;
  }

  public isAttributeEditable(model: QueryAttribute): boolean {
    if (model && model.resourceType === AttributesResourceType.Collection) {
      const collection = this.collectionsMap[model.resourceId];
      return (
        collection &&
        isCollectionAttributeEditable(model.attributeId, collection, this.attributePermissions(model), this.query)
      );
    } else if (model && model.resourceType === AttributesResourceType.LinkType) {
      const linkType = this.linkTypesMap[model.resourceId];
      return (
        linkType &&
        isLinkTypeAttributeEditable(model.attributeId, linkType, this.attributePermissions(model), this.query)
      );
    }

    return false;
  }

  public attributePermissions(model: QueryAttribute): AllowedPermissions {
    if (!model) {
      return {};
    }

    return queryAttributePermissions(model, this.permissions, this.linkTypesMap);
  }

  public getAttributeResourceColor(model: QueryAttribute): string {
    const resource = this.getNextCollectionResource(model.resourceIndex);
    return resource && (<Collection>resource).color;
  }

  public getAttributeColor(model: QueryAttribute, dataResources: DataResource[]): string {
    const constraint = this.findAttributeConstraint(model);
    const values = (model && (dataResources || []).map(dataResource => dataResource.data[model.attributeId])) || [];
    return this.parseColor(constraint, values);
  }

  public getAttributeIcons(model: QueryAttribute): string[] {
    if (model.resourceType === AttributesResourceType.Collection) {
      return [(<Collection>this.getResource(model))?.icon].filter(icon => !!icon);
    } else if (model.resourceType === AttributesResourceType.LinkType) {
      const previousCollection = <Collection>this.getPreviousCollectionResource(model.resourceIndex);
      const nextCollection = <Collection>this.getNextCollectionResource(model.resourceIndex);
      return [previousCollection?.icon, nextCollection?.icon].filter(icon => !!icon);
    }

    return [];
  }

  private parseColor(constraint: Constraint, values: any[]): string {
    if (constraint?.type === ConstraintType.Select) {
      for (let i = 0; i < values.length; i++) {
        const options = (<SelectConstraint>constraint).createDataValue(values[i]).options;
        if (options.length > 0 && options[0].background) {
          return options[0].background;
        }
      }
    } else if (constraint?.type === ConstraintType.Boolean) {
      if (values?.[0]) {
        return '#b6d7a8';
      } else {
        return '#ea9999';
      }
    }

    const colorConstraint = new ColorConstraint({});
    const colorDataValue = values
      .map(color => colorConstraint.createDataValue(color))
      .find(dataValue => dataValue.isValid());
    return colorDataValue?.format();
  }

  public findAttributeConstraint(model: QueryAttribute): Constraint {
    const resource = model && this.getResource(model);
    return (resource && findAttributeConstraint(resource.attributes, model.attributeId)) || new UnknownConstraint();
  }

  private convertQueryAttribute(attribute: QueryAttribute, unique: boolean = true): DataAggregatorAttribute {
    return {
      attributeId: attribute.attributeId,
      resourceIndex: attribute.resourceIndex,
      data: attribute.constraint,
      unique,
    };
  }
}
