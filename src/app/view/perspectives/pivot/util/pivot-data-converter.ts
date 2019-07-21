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

import {
  PivotAttribute,
  PivotConfig,
  PivotRowColumnAttribute,
  PivotValueAttribute,
} from '../../../../core/store/pivots/pivot';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {Query} from '../../../../core/store/navigation/query';
import {Constraint, ConstraintData} from '../../../../core/model/data/constraint';
import {
  AggregatedData,
  DataAggregatorAttribute,
  DataAggregator,
  AggregatedDataMap,
  AggregatedDataValues,
} from '../../../../shared/utils/data/data-aggregator';
import {PivotData, PivotDataHeader} from './pivot-data';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {aggregateDataResources, DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {isArray, isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {formatDataValue} from '../../../../shared/utils/data.utils';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';

export class PivotDataConverter {
  private collections: Collection[];
  private documents: DocumentModel[];
  private linkTypes: LinkType[];
  private linkInstances: LinkInstance[];
  private config: PivotConfig;
  private constraintData?: ConstraintData;

  private dataAggregator: DataAggregator;

  constructor(
    private constraintItemsFormatter: SelectItemWithConstraintFormatter,
    private translateAggregation: (type: DataAggregationType) => string
  ) {
    this.dataAggregator = new DataAggregator((value, constraint, data, aggregatorAttribute) =>
      this.formatPivotValue(value, constraint, data, aggregatorAttribute)
    );
  }

  private formatPivotValue(
    value: any,
    constraint: Constraint,
    constraintData: ConstraintData,
    aggregatorAttribute: DataAggregatorAttribute
  ) {
    const pivotAttribute = this.findPivotAttributeByAggregatorAttribute(aggregatorAttribute);
    const overrideConstraint =
      pivotAttribute &&
      pivotAttribute.constraint &&
      this.constraintItemsFormatter.checkValidConstraintOverride(constraint, pivotAttribute.constraint);

    return formatDataValue(value, overrideConstraint || constraint, constraintData);
  }

  private findPivotAttributeByAggregatorAttribute(
    aggregatorAttribute: DataAggregatorAttribute
  ): PivotRowColumnAttribute {
    return [...(this.config.rowAttributes || []), ...(this.config.columnAttributes || [])].find(
      attribute =>
        attribute.attributeId === aggregatorAttribute.attributeId &&
        attribute.resourceIndex === aggregatorAttribute.resourceIndex
    );
  }

  private updateData(
    config: PivotConfig,
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    constraintData: ConstraintData
  ) {
    this.config = config;
    this.collections = collections;
    this.documents = documents;
    this.linkTypes = linkTypes;
    this.linkInstances = linkInstances;
    this.constraintData = constraintData;
  }

  public transform(
    config: PivotConfig,
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    query: Query,
    constraintData?: ConstraintData
  ): PivotData {
    this.updateData(config, collections, documents, linkTypes, linkInstances, constraintData);
    this.dataAggregator.updateData(collections, documents, linkTypes, linkInstances, query, constraintData);

    const rowAttributes = (config.rowAttributes || []).map(attribute => this.convertPivotAttribute(attribute));
    const columnAttributes = (config.columnAttributes || []).map(attribute => this.convertPivotAttribute(attribute));
    const valueAttributes = (config.valueAttributes || []).map(attribute => this.convertPivotAttribute(attribute));
    if (rowAttributes.length === 0 && columnAttributes.length === 0) {
      return this.convertValueAttributes(config.valueAttributes || []);
    }

    const aggregatedData = this.dataAggregator.aggregate(rowAttributes, columnAttributes, valueAttributes);
    return this.convertAggregatedData(aggregatedData, config.valueAttributes || []);
  }

  private convertPivotAttribute(pivotAttribute: PivotAttribute): DataAggregatorAttribute {
    return {resourceIndex: pivotAttribute.resourceIndex, attributeId: pivotAttribute.attributeId};
  }

  private convertValueAttributes(valueAttributes: PivotValueAttribute[]): PivotData {
    const {titles, constraints} = this.createValueTitles(valueAttributes);
    const {headers} = this.convertMapToPivotDataHeader({}, 0, [], titles);

    const values = (valueAttributes || []).map(valueAttribute => {
      const dataResources = this.findDataResourcesByPivotAttribute(valueAttribute);
      const attribute = this.findAttributeByPivotAttribute(valueAttribute);
      return aggregateDataResources(valueAttribute.aggregation, dataResources, attribute, true);
    });

    return {
      columnHeaders: headers,
      rowHeaders: [],
      valueTitles: titles,
      values: [values],
      valuesConstraints: constraints,
      constraintData: this.constraintData,
    };
  }

  private findDataResourcesByPivotAttribute(pivotAttribute: PivotAttribute): DataResource[] {
    if (pivotAttribute.resourceType === AttributesResourceType.Collection) {
      return (this.documents || []).filter(document => document.collectionId === pivotAttribute.resourceId);
    } else if (pivotAttribute.resourceType === AttributesResourceType.LinkType) {
      return (this.linkInstances || []).filter(link => link.linkTypeId === pivotAttribute.resourceId);
    }
    return [];
  }

  private convertAggregatedData(aggregatedData: AggregatedData, valueAttributes: PivotValueAttribute[]): PivotData {
    const rowData = this.convertMapToPivotDataHeader(aggregatedData.map, aggregatedData.rowLevels, this.getRowColors());

    const {titles, constraints} = this.createValueTitles(valueAttributes);
    const columnData = this.convertMapToPivotDataHeader(
      aggregatedData.rowLevels > 0 ? aggregatedData.columnsMap : aggregatedData.map,
      aggregatedData.columnLevels,
      this.getColumnColors(),
      titles
    );

    const values = this.initValues(rowData.maxIndex + 1, columnData.maxIndex + 1);
    if ((valueAttributes || []).length > 0) {
      this.fillValues(values, rowData.headers, columnData.headers, valueAttributes, aggregatedData);
    }

    return {
      rowHeaders: rowData.headers,
      columnHeaders: columnData.headers,
      valueTitles: titles,
      values,
      valuesConstraints: constraints,
      constraintData: this.constraintData,
    };
  }

  private convertMapToPivotDataHeader(
    map: Record<string, any>,
    levels: number,
    colors: string[],
    valueTitles?: string[]
  ): {headers: PivotDataHeader[]; maxIndex: number} {
    if (levels === 0) {
      if ((valueTitles || []).length > 0) {
        return {
          headers: valueTitles.map((title, index) => ({title, targetIndex: index, color: this.getValueColor(index)})),
          maxIndex: valueTitles.length - 1,
        };
      }
      return {headers: [], maxIndex: 0};
    }

    const headers = [];
    const data = {maxIndex: 0};
    let currentIndex = 0;
    Object.keys(map).forEach((title, index) => {
      if (levels === 1 && (valueTitles || []).length <= 1) {
        headers.push({title, targetIndex: currentIndex, color: colors[0]});
        data.maxIndex = Math.max(data.maxIndex, currentIndex);
      } else {
        headers.push({title, color: colors[0]});
      }

      this.iterateThroughPivotDataHeader(
        map[title],
        headers[index],
        currentIndex,
        1,
        levels,
        colors,
        valueTitles,
        data
      );
      currentIndex += this.numChildren(map[title], levels - 1, (valueTitles && valueTitles.length) || 1);
    });

    return {headers, maxIndex: data.maxIndex};
  }

  private getRowColors(): string[] {
    return (this.config.rowAttributes || []).map(attribute => {
      const resource = this.dataAggregator.getNextCollectionResource(attribute.resourceIndex);
      return resource && (<Collection>resource).color;
    });
  }

  private getColumnColors(): string[] {
    return (this.config.columnAttributes || []).map(attribute => {
      const resource = this.dataAggregator.getNextCollectionResource(attribute.resourceIndex);
      return resource && (<Collection>resource).color;
    });
  }

  private getValueColor(index: number): string {
    const valueAttribute = this.config.valueAttributes[index];
    if (valueAttribute) {
      const resource = this.dataAggregator.getNextCollectionResource(valueAttribute.resourceIndex);
      return resource && (<Collection>resource).color;
    }
    return undefined;
  }

  private iterateThroughPivotDataHeader(
    currentMap: Record<string, any>,
    header: PivotDataHeader,
    headerIndex: number,
    level: number,
    maxLevels: number,
    colors: string[],
    valueTitles: string[],
    additionalData: {maxIndex: number}
  ) {
    if (level === maxLevels) {
      if ((valueTitles || []).length > 1) {
        header.children = valueTitles.map((title, index) => ({
          title,
          targetIndex: headerIndex + index,
          color: this.getValueColor(index),
        }));
        additionalData.maxIndex = Math.max(additionalData.maxIndex, headerIndex + valueTitles.length - 1);
      }
      return;
    }

    header.children = [];
    let currentIndex = headerIndex;
    Object.keys(currentMap).forEach((title, index) => {
      if (level + 1 === maxLevels && (valueTitles || []).length <= 1) {
        header.children.push({title, targetIndex: currentIndex, color: colors[level]});
        additionalData.maxIndex = Math.max(additionalData.maxIndex, currentIndex);
      } else {
        header.children.push({title, color: colors[level]});
      }

      this.iterateThroughPivotDataHeader(
        currentMap[title],
        header.children[index],
        currentIndex,
        level + 1,
        maxLevels,
        colors,
        valueTitles,
        additionalData
      );

      currentIndex += this.numChildren(
        currentMap[title],
        maxLevels - (level + 1),
        (valueTitles && valueTitles.length) || 1
      );
    });
  }

  private numChildren(map: Record<string, any>, maxLevels: number, numTitles: number): number {
    if (maxLevels === 0) {
      return numTitles;
    }

    const keys = Object.keys(map || {});
    if (maxLevels === 1) {
      return keys.length * numTitles;
    }

    const count = keys.reduce((sum, key) => sum + this.numChildrenRecursive(map[key], 1, maxLevels), 0);
    return count * numTitles;
  }

  private numChildrenRecursive(map: Record<string, any>, level: number, maxLevels: number): number {
    if (level >= maxLevels) {
      return 0;
    }

    const keys = Object.keys(map || {});
    if (level + 1 === maxLevels) {
      return keys.length;
    }

    return keys.reduce((sum, key) => sum + this.numChildrenRecursive(map[key], level + 1, maxLevels), 0);
  }

  private createValueTitles(valueAttributes: PivotValueAttribute[]): {titles: string[]; constraints: Constraint[]} {
    return (valueAttributes || []).reduce(
      ({titles, constraints}, pivotAttribute) => {
        const attribute = this.findAttributeByPivotAttribute(pivotAttribute);
        constraints.push(attribute && attribute.constraint);
        const title = this.createValueTitle(pivotAttribute.aggregation, attribute && attribute.name);
        titles.push(title);

        return {titles, constraints};
      },
      {titles: [], constraints: []}
    );
  }

  public createValueTitle(aggregation: DataAggregationType, attributeName: string): string {
    const valueAggregationTitle = this.translateAggregation(aggregation);
    return `${valueAggregationTitle} ${attributeName || ''}`.trim();
  }

  private initValues(rows: number, columns: number): number[][] {
    const matrix = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < columns; j++) {
        matrix[i][j] = undefined;
      }
    }

    return matrix;
  }

  private fillValues(
    values: number[][],
    rowHeaders: PivotDataHeader[],
    columnHeaders: PivotDataHeader[],
    valueAttributes: PivotValueAttribute[],
    aggregatedData: AggregatedData
  ) {
    if (rowHeaders.length > 0) {
      this.iterateThroughRowHeaders(values, rowHeaders, columnHeaders, valueAttributes, aggregatedData.map);
    } else {
      this.iterateThroughColumnHeaders(values, columnHeaders, 0, valueAttributes, aggregatedData.map);
    }
  }

  private iterateThroughRowHeaders(
    values: number[][],
    rowHeaders: PivotDataHeader[],
    columnHeaders: PivotDataHeader[],
    valueAttributes: PivotValueAttribute[],
    currentMap: AggregatedDataMap
  ) {
    for (const rowHeader of rowHeaders) {
      const rowHeaderMap = currentMap[rowHeader.title] || {};

      if (rowHeader.children) {
        this.iterateThroughRowHeaders(values, rowHeader.children, columnHeaders, valueAttributes, rowHeaderMap);
      } else if (isNotNullOrUndefined(rowHeader.targetIndex) && columnHeaders.length > 0) {
        this.iterateThroughColumnHeaders(values, columnHeaders, rowHeader.targetIndex, valueAttributes, rowHeaderMap);
      }
    }
  }

  private iterateThroughColumnHeaders(
    values: number[][],
    columnHeaders: PivotDataHeader[],
    rowIndex: number,
    valueAttributes: PivotValueAttribute[],
    currentMap: AggregatedDataMap | AggregatedDataValues[]
  ) {
    for (const columnHeader of columnHeaders) {
      if (columnHeader.children) {
        this.iterateThroughColumnHeaders(
          values,
          columnHeader.children,
          rowIndex,
          valueAttributes,
          currentMap[columnHeader.title] || {}
        );
      } else if (isNotNullOrUndefined(columnHeader.targetIndex)) {
        const aggregatedDataValues = isArray(currentMap)
          ? currentMap
          : (currentMap[columnHeader.title] as AggregatedDataValues[]);

        if (valueAttributes.length) {
          const valueIndex = columnHeader.targetIndex % valueAttributes.length;
          values[rowIndex][columnHeader.targetIndex] = this.aggregateValue(
            valueAttributes[valueIndex],
            aggregatedDataValues
          );
        }
      }
    }
  }

  private aggregateValue(valueAttribute: PivotValueAttribute, aggregatedDataValues: AggregatedDataValues[]): any {
    const aggregatedDataValue = (aggregatedDataValues || []).find(
      agg => agg.resourceId === valueAttribute.resourceId && agg.type === valueAttribute.resourceType
    );
    if (aggregatedDataValue) {
      const dataResources = aggregatedDataValue.objects;
      const attribute = this.findAttributeByPivotAttribute(valueAttribute);
      return aggregateDataResources(valueAttribute.aggregation, dataResources, attribute, true);
    }

    return null;
  }

  private findAttributeByPivotAttribute(valueAttribute: PivotAttribute): Attribute {
    const resource = this.findResourceByPivotAttribute(valueAttribute);
    return resource && (resource.attributes || []).find(attribute => attribute.id === valueAttribute.attributeId);
  }

  private findResourceByPivotAttribute(valueAttribute: PivotAttribute): AttributesResource {
    if (valueAttribute.resourceType === AttributesResourceType.Collection) {
      return (this.collections || []).find(collection => collection.id === valueAttribute.resourceId);
    } else if (valueAttribute.resourceType === AttributesResourceType.LinkType) {
      return (this.linkTypes || []).find(linkType => linkType.id === valueAttribute.resourceId);
    }

    return null;
  }
}
