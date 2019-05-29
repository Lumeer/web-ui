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

import {PivotAttribute, PivotConfig, PivotValueAttribute} from '../../../../core/store/pivots/pivot';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {Query} from '../../../../core/store/navigation/query';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {
  AggregatedData,
  DataAggregatorAttribute,
  DataAggregator,
  AggregatedDataMap,
  AggregatedDataValues,
} from '../../../../shared/utils/data/data-aggregator';
import {PivotData, PivotDataHeader} from './pivot-data';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {aggregateDataResources, DataAggregationType} from '../../../../shared/utils/data/data-aggregation';
import {isNotNullOrUndefined} from '../../../../shared/utils/common.utils';

export class PivotDataConverter {
  private collections: Collection[];
  private documents: DocumentModel[];
  private linkTypes: LinkType[];
  private linkInstances: LinkInstance[];

  private dataAggregator: DataAggregator;

  constructor(private i18n: I18n) {
    this.dataAggregator = new DataAggregator();
  }

  private updateData(
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[]
  ) {
    this.collections = collections;
    this.documents = documents;
    this.linkTypes = linkTypes;
    this.linkInstances = linkInstances;
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
    this.updateData(collections, documents, linkTypes, linkInstances);

    const rowAttributes = (config.rowAttributes || []).map(attribute => this.convertPivotAttribute(attribute));
    const columnAttributes = (config.columnAttributes || []).map(attribute => this.convertPivotAttribute(attribute));
    const valueAttributes = (config.valueAttributes || []).map(attribute => this.convertPivotAttribute(attribute));
    if (rowAttributes.length === 0 && columnAttributes.length === 0) {
      return this.convertValueAttributes(config.valueAttributes || []);
    }

    this.dataAggregator.updateData(collections, documents, linkTypes, linkInstances, query, constraintData);
    const aggregatedData = this.dataAggregator.aggregate(rowAttributes, columnAttributes, valueAttributes);
    return this.convertAggregatedData(aggregatedData, config.valueAttributes || []);
  }

  private convertPivotAttribute(pivotAttribute: PivotAttribute): DataAggregatorAttribute {
    return {resourceIndex: pivotAttribute.resourceIndex, attributeId: pivotAttribute.attributeId};
  }

  private convertValueAttributes(valueAttributes: PivotValueAttribute[]): PivotData {
    const valueTitles = this.createValueTitles(valueAttributes);
    const {headers} = this.convertMapToPivotDataHeader({}, 0, valueTitles);

    const values = (valueAttributes || []).map(valueAttribute => {
      const dataResources = this.findDataResourcesByPivotAttribute(valueAttribute);
      const attribute = this.findAttributeByPivotAttribute(valueAttribute);
      return aggregateDataResources(valueAttribute.aggregation, dataResources, attribute, true);
    });

    return {columnHeaders: headers, rowHeaders: [], values};
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
    const rowData = this.convertMapToPivotDataHeader(aggregatedData.map, aggregatedData.rowLevels);

    const valueTitles = this.createValueTitles(valueAttributes);
    const columnData = this.convertMapToPivotDataHeader(
      aggregatedData.columnsMap,
      aggregatedData.columnLevels,
      valueTitles
    );

    const values = this.initValues(rowData.maxIndex + 1, columnData.maxIndex + 1);
    if ((valueAttributes || []).length > 0) {
      this.fillValues(values, rowData.headers, columnData.headers, valueAttributes, aggregatedData);
    }

    return {rowHeaders: rowData.headers, columnHeaders: columnData.headers, values};
  }

  private convertMapToPivotDataHeader(
    map: Record<string, any>,
    levels: number,
    valueTitles?: string[]
  ): {headers: PivotDataHeader[]; maxIndex: number} {
    if (levels === 0) {
      if ((valueTitles || []).length > 0) {
        return {
          headers: valueTitles.map((title, index) => ({title, targetIndex: index})),
          maxIndex: valueTitles.length,
        };
      }
      return {headers: [], maxIndex: 0};
    }

    const headers = [];
    const data = {maxIndex: 0};
    Object.keys(map).forEach((title, index) => {
      headers.push({title, targetIndex: levels === 1 && (valueTitles || []).length <= 1 ? index : undefined});
      this.iterateThroughPivotDataHeader(map[title], headers, index, 1, levels, valueTitles, data);
    });

    return {headers, maxIndex: data.maxIndex};
  }

  private iterateThroughPivotDataHeader(
    currentMap: Record<string, any>,
    headers: PivotDataHeader[],
    headerIndex: number,
    level: number,
    maxLevels: number,
    valueTitles: string[],
    additionalData: {maxIndex: number}
  ) {
    if (level === maxLevels) {
      if ((valueTitles || []).length > 1) {
        const maxIndex = this.maxPreviousHeaderIndex(headers, headerIndex);
        headers[headerIndex].children = valueTitles.map((title, index) => ({title, targetIndex: maxIndex + index}));
        additionalData.maxIndex = Math.max(additionalData.maxIndex, maxIndex + valueTitles.length - 1);
      }
      return;
    }

    headers[headerIndex].children = [];
    Object.keys(currentMap).forEach((title, index) => {
      if (level + 1 === maxLevels && (valueTitles || []).length <= 1) {
        const maxIndex = this.maxPreviousHeaderIndex(headers, headerIndex);
        headers[headerIndex].children.push({title, targetIndex: maxIndex + index});
        additionalData.maxIndex = Math.max(additionalData.maxIndex, maxIndex + index);
      } else {
        headers[headerIndex].children.push({title});
      }

      this.iterateThroughPivotDataHeader(
        currentMap[title],
        headers[headerIndex].children,
        index,
        level + 1,
        maxLevels,
        valueTitles,
        additionalData
      );
    });
  }

  private maxPreviousHeaderIndex(headers: PivotDataHeader[], headerIndex: number): number {
    const previousHeader = headers[headerIndex - 1];
    const previousChildren = (previousHeader && previousHeader.children) || [];
    if (previousChildren.length === 0) {
      return -1;
    }

    return previousChildren[previousChildren.length - 1].targetIndex;
  }

  private createValueTitles(valueAttributes: PivotValueAttribute[]): string[] {
    return (valueAttributes || []).map(pivotAttribute => {
      const attribute = this.findAttributeByPivotAttribute(pivotAttribute);
      const valueAggregationTitle = this.createValueAggregationTitle(pivotAttribute.aggregation);
      return `${valueAggregationTitle} ${(attribute && attribute.name) || ''}`.trim();
    });
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
        const aggregatedDataValues = (valueAttributes.length === 1
          ? currentMap[columnHeader.title]
          : currentMap) as AggregatedDataValues[];
        for (const valueAttribute of valueAttributes) {
          values[rowIndex][columnHeader.targetIndex] = this.aggregateValue(valueAttribute, aggregatedDataValues);
        }
      }
    }
  }

  private aggregateValue(valueAttribute: PivotValueAttribute, aggregatedDataValues: AggregatedDataValues[]): number {
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

  private createValueAggregationTitle(aggregation: DataAggregationType): string {
    return this.i18n(
      {
        id: 'pivot.data.aggregation',
        value: '{select, aggregation, sum {Sum of} min {Min of} max {Max of} avg {Average of} count {Count of}}',
      },
      {aggregation}
    );
  }
}
