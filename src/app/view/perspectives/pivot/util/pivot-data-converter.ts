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

import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query, QueryStem} from '../../../../core/store/navigation/query/query';
import {
  PivotAttribute,
  PivotConfig,
  PivotRowColumnAttribute,
  PivotSort,
  PivotStemConfig,
  PivotValueAttribute,
} from '../../../../core/store/pivots/pivot';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {deepObjectsEquals, isArray, isNotNullOrUndefined} from '../../../../shared/utils/common.utils';
import {
  aggregateDataResources,
  DataAggregationType,
  isValueAggregation,
} from '../../../../shared/utils/data/data-aggregation';
import {
  AggregatedMapData,
  AggregatedDataMap,
  AggregatedDataValues,
  DataAggregator,
  DataAggregatorAttribute,
} from '../../../../shared/utils/data/data-aggregator';
import {PivotData, PivotDataHeader, PivotStemData} from './pivot-data';
import {pivotStemConfigIsEmpty} from './pivot-util';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {
  Constraint,
  ConstraintData,
  ConstraintType,
  DataValue,
  NumberConstraint,
  UnknownConstraint,
} from '@lumeer/data-filters';

interface PivotMergeData {
  configs: PivotStemConfig[];
  stems: QueryStem[];
  type: PivotConfigType;
}

enum PivotConfigType {
  Values,
  Rows,
  Columns,
  RowsAndColumns,
}

interface PivotColors {
  rows: string[];
  columns: string[];
  values: string[];
}

interface PivotConfigData {
  rowShowSums: boolean[];
  rowSorts: PivotSort[];
  columnShowSums: boolean[];
  columnSorts: PivotSort[];
  rowAttributes: Attribute[];
  columnAttributes: Attribute[];
}

export class PivotDataConverter {
  private collections: Collection[];
  private documents: DocumentModel[];
  private linkTypes: LinkType[];
  private linkInstances: LinkInstance[];
  private config: PivotStemConfig;
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
  ): any {
    const pivotConstraint = aggregatorAttribute.data && (aggregatorAttribute.data as Constraint);
    const overrideConstraint =
      pivotConstraint && this.constraintItemsFormatter.checkValidConstraintOverride(constraint, pivotConstraint);
    const finalConstraint = overrideConstraint || constraint || new UnknownConstraint();
    return this.formatDataValue(finalConstraint.createDataValue(value, constraintData), finalConstraint);
  }

  private formatDataValue(dataValue: DataValue, constraint: Constraint): any {
    switch (constraint.type) {
      case ConstraintType.DateTime:
        return dataValue.format();
      default:
        return dataValue.serialize();
    }
  }

  private updateData(
    collections: Collection[],
    documents: DocumentModel[],
    linkTypes: LinkType[],
    linkInstances: LinkInstance[],
    constraintData: ConstraintData
  ) {
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
    this.updateData(collections, documents, linkTypes, linkInstances, constraintData);

    const {stemsConfigs, stems} = this.filterEmptyConfigs(config, query);

    const mergeData = this.createPivotMergeData(config.mergeTables, stemsConfigs, stems);
    const ableToMerge = mergeData.length <= 1;
    const data = this.mergePivotData(mergeData);
    return {data: data, constraintData, ableToMerge, mergeTables: config.mergeTables};
  }

  private filterEmptyConfigs(config: PivotConfig, query: Query): {stemsConfigs: PivotStemConfig[]; stems: QueryStem[]} {
    return (config.stemsConfigs || []).reduce(
      ({stemsConfigs, stems}, stemConfig, index) => {
        if (!pivotStemConfigIsEmpty(stemConfig)) {
          const stem = (query.stems || [])[index];
          stemsConfigs.push(stemConfig);
          stems.push(stem);
        }

        return {stemsConfigs, stems};
      },
      {stemsConfigs: [], stems: []}
    );
  }

  private createPivotMergeData(
    mergeTables: boolean,
    stemsConfigs: PivotStemConfig[],
    stems: QueryStem[]
  ): PivotMergeData[] {
    return stemsConfigs.reduce((mergeData: PivotMergeData[], stemConfig, index) => {
      const configType = getPivotStemConfigType(stemConfig);
      const mergeDataIndex = mergeData.findIndex(
        data => data.type === configType && canMergeConfigsByType(data.type, data.configs[0], stemConfig)
      );
      if (mergeTables && mergeDataIndex >= 0) {
        mergeData[mergeDataIndex].configs.push(stemConfig);
        mergeData[mergeDataIndex].stems.push(stems[index]);
      } else {
        mergeData.push({configs: [stemConfig], stems: [stems[index]], type: configType});
      }

      return mergeData;
    }, []);
  }

  private mergePivotData(mergeData: PivotMergeData[]): PivotStemData[] {
    return mergeData.reduce((stemData, data) => {
      if (data.type === PivotConfigType.Values) {
        stemData.push(this.convertValueAttributes(data.configs, data.stems));
      } else {
        stemData.push(this.transformStems(data.configs, data.stems));
      }
      return stemData;
    }, []);
  }

  private transformStems(configs: PivotStemConfig[], queryStems: QueryStem[]): PivotStemData {
    const pivotColors: PivotColors = {rows: [], columns: [], values: []};
    const mergedValueAttributes: PivotValueAttribute[] = [];
    let mergedAggregatedData: AggregatedMapData = null;
    let additionalData: PivotConfigData;

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const queryStem = queryStems[i];

      this.config = config;
      this.dataAggregator.updateData(
        this.collections,
        this.documents,
        this.linkTypes,
        this.linkInstances,
        queryStem,
        this.constraintData
      );
      const rowAttributes = (config.rowAttributes || []).map(attribute =>
        this.convertPivotRowColumnAttribute(attribute)
      );
      const columnAttributes = (config.columnAttributes || []).map(attribute =>
        this.convertPivotRowColumnAttribute(attribute)
      );
      const valueAttributes = (config.valueAttributes || []).map(attribute => this.convertPivotAttribute(attribute));

      pivotColors.rows.push(...this.getAttributesColors(config.rowAttributes));
      pivotColors.columns.push(...this.getAttributesColors(config.columnAttributes));
      pivotColors.values.push(...this.getAttributesColors(config.valueAttributes));

      const aggregatedData = this.dataAggregator.aggregate(rowAttributes, columnAttributes, valueAttributes);
      mergedAggregatedData = this.mergeAggregatedData(mergedAggregatedData, aggregatedData);

      const filteredValueAttributes = (config.valueAttributes || []).filter(
        valueAttr => !mergedValueAttributes.some(merAttr => deepObjectsEquals(valueAttr, merAttr))
      );
      mergedValueAttributes.push(...filteredValueAttributes);

      if (!additionalData) {
        additionalData = {
          rowShowSums: (config.rowAttributes || []).map(attr => attr.showSums),
          rowSorts: (config.rowAttributes || []).map(attr => attr.sort),
          rowAttributes: (config.rowAttributes || []).map(attr => this.pivotAttributeAttribute(attr)),
          columnShowSums: (config.columnAttributes || []).map(attr => attr.showSums),
          columnSorts: (config.columnAttributes || []).map(attr => attr.sort),
          columnAttributes: (config.columnAttributes || []).map(attr => this.pivotAttributeAttribute(attr)),
        };
      }
    }

    return this.convertAggregatedData(mergedAggregatedData, mergedValueAttributes, pivotColors, additionalData);
  }

  private pivotAttributeConstraint(pivotAttribute: PivotAttribute): Constraint {
    const attribute = this.findAttributeByPivotAttribute(pivotAttribute);
    const constraint = attribute && attribute.constraint;
    const overrideConstraint =
      pivotAttribute.constraint &&
      this.constraintItemsFormatter.checkValidConstraintOverride(constraint, pivotAttribute.constraint);
    return overrideConstraint || constraint;
  }

  private pivotAttributeAttribute(pivotAttribute: PivotAttribute): Attribute {
    const attribute = this.findAttributeByPivotAttribute(pivotAttribute);
    if (attribute) {
      const constraint = attribute && attribute.constraint;
      const overrideConstraint =
        pivotAttribute.constraint &&
        this.constraintItemsFormatter.checkValidConstraintOverride(constraint, pivotAttribute.constraint);
      return {...attribute, constraint: overrideConstraint || constraint || new UnknownConstraint()};
    }
    return null;
  }

  private mergeAggregatedData(a1: AggregatedMapData, a2: AggregatedMapData): AggregatedMapData {
    if (!a1 || !a2) {
      return a1 || a2;
    }

    this.mergeMaps(a1.map, a2.map);
    this.mergeMaps(a1.columnsMap, a2.columnsMap);
    return {
      map: a1.map,
      columnsMap: a1.columnsMap,
      rowLevels: Math.max(a1.rowLevels, a2.rowLevels),
      columnLevels: Math.max(a1.columnLevels, a2.columnLevels),
    };
  }

  private mergeMaps(m1: Record<string, any>, m2: Record<string, any>) {
    Object.keys(m2).forEach(key => {
      if (m1[key]) {
        if (isArray(m1[key]) && isArray(m2[key])) {
          m1[key].push(...m2[key]);
        } else if (!isArray(m1[key]) && !isArray(m2[key])) {
          this.mergeMaps(m1[key], m2[key]);
        }
      } else {
        m1[key] = m2[key];
      }
    });
  }

  private getAttributesColors(attributes: PivotAttribute[]): string[] {
    return (attributes || []).map(attribute => {
      const resource = this.dataAggregator.getNextCollectionResource(attribute.resourceIndex);
      return resource && (<Collection>resource).color;
    });
  }

  private convertPivotRowColumnAttribute(pivotAttribute: PivotRowColumnAttribute): DataAggregatorAttribute {
    return {...this.convertPivotAttribute(pivotAttribute), data: pivotAttribute.constraint};
  }

  private convertPivotAttribute(pivotAttribute: PivotAttribute): DataAggregatorAttribute {
    return {resourceIndex: pivotAttribute.resourceIndex, attributeId: pivotAttribute.attributeId};
  }

  private convertValueAttributes(configs: PivotStemConfig[], stems: QueryStem[]): PivotStemData {
    const data = configs.reduce(
      (allData, config, index) => {
        this.dataAggregator.updateData(
          this.collections,
          this.documents,
          this.linkTypes,
          this.linkInstances,
          stems[index],
          this.constraintData
        );

        const valueAttributes = config.valueAttributes || [];
        allData.valueTypes.push(...valueAttributes.map(attr => attr.valueType));
        const valueColors = this.getAttributesColors(valueAttributes);

        const {titles, constraints} = this.createValueTitles(valueAttributes);
        allData.titles.push(...titles);
        allData.constraints.push(...constraints);

        const {headers} = this.convertMapToPivotDataHeader({}, 0, [], valueColors, [], titles, allData.headers.length);
        allData.headers.push(...headers);

        allData.aggregations = [...(valueAttributes || []).map(valueAttribute => valueAttribute.aggregation)];

        const values = (valueAttributes || []).map(valueAttribute => {
          const dataResources = this.findDataResourcesByPivotAttribute(valueAttribute);
          const attribute = this.findAttributeByPivotAttribute(valueAttribute);
          return aggregateDataResources(valueAttribute.aggregation, dataResources, attribute, true);
        });
        allData.values.push(...values);
        return allData;
      },
      {titles: [], constraints: [], headers: [], values: [], valueTypes: [], aggregations: []}
    );

    return {
      columnHeaders: data.headers,
      rowHeaders: [],
      valueTitles: data.titles,
      values: [data.values],
      valuesConstraints: data.constraints,
      valueTypes: data.valueTypes,
      valueAggregations: data.aggregations,

      rowShowSums: [],
      rowSorts: [],
      columnShowSums: [],
      columnSorts: [],

      hasAdditionalColumnLevel: true,
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

  private convertAggregatedData(
    aggregatedData: AggregatedMapData,
    valueAttributes: PivotValueAttribute[],
    pivotColors: PivotColors,
    additionalData: PivotConfigData
  ): PivotStemData {
    const rowData = this.convertMapToPivotDataHeader(
      aggregatedData.map,
      aggregatedData.rowLevels,
      pivotColors.rows,
      pivotColors.values,
      additionalData.rowAttributes
    );

    const {titles: valueTitles, constraints: valuesConstraints} = this.createValueTitles(valueAttributes);
    const columnData = this.convertMapToPivotDataHeader(
      aggregatedData.rowLevels > 0 ? aggregatedData.columnsMap : aggregatedData.map,
      aggregatedData.columnLevels,
      pivotColors.columns,
      pivotColors.values,
      additionalData.columnAttributes,
      valueTitles
    );

    const values = this.initValues(rowData.maxIndex + 1, columnData.maxIndex + 1);
    if ((valueAttributes || []).length > 0) {
      this.fillValues(values, rowData.headers, columnData.headers, valueAttributes, aggregatedData);
    }

    const valueAggregations = (valueAttributes || []).map(valueAttribute => valueAttribute.aggregation);

    const hasAdditionalColumnLevel =
      (aggregatedData.columnLevels === 0 && valueTitles.length > 0) ||
      (aggregatedData.columnLevels > 0 && valueTitles.length > 1);
    return {
      rowHeaders: rowData.headers,
      columnHeaders: columnData.headers,
      valueTitles,
      values,
      valuesConstraints,
      valueAggregations,

      ...additionalData,

      valueTypes: valueAttributes.map(attr => attr.valueType),
      hasAdditionalColumnLevel,
    };
  }

  private convertMapToPivotDataHeader(
    map: Record<string, any>,
    levels: number,
    colors: string[],
    valueColors: string[],
    attributes: Attribute[],
    valueTitles?: string[],
    additionalNum: number = 0
  ): {headers: PivotDataHeader[]; maxIndex: number} {
    const headers: PivotDataHeader[] = [];
    const data = {maxIndex: 0};
    if (levels === 0) {
      if ((valueTitles || []).length > 0) {
        headers.push(
          ...valueTitles.map((title, index) => ({
            title,
            targetIndex: index + additionalNum,
            color: valueColors[index],
            isValueHeader: true,
          }))
        );
        data.maxIndex = valueTitles.length - 1 + additionalNum;
      }
    } else {
      let currentIndex = additionalNum;
      Object.keys(map).forEach((title, index) => {
        const attribute = attributes && attributes[0];
        if (levels === 1 && (valueTitles || []).length <= 1) {
          headers.push({
            title,
            targetIndex: currentIndex,
            color: colors[0],
            constraint: attribute?.constraint || new UnknownConstraint(),
            isValueHeader: false,
            attributeName: attribute?.name,
          });
          data.maxIndex = Math.max(data.maxIndex, currentIndex);
        } else {
          headers.push({
            title,
            color: colors[0],
            constraint: attribute?.constraint || new UnknownConstraint(),
            isValueHeader: false,
            attributeName: attribute?.name,
          });
        }

        this.iterateThroughPivotDataHeader(
          map[title],
          headers[index],
          currentIndex,
          1,
          levels,
          colors,
          valueColors,
          valueTitles,
          attributes,
          data
        );
        currentIndex += this.numChildren(map[title], levels - 1, (valueTitles && valueTitles.length) || 1);
      });
    }

    return {headers, maxIndex: data.maxIndex};
  }

  private iterateThroughPivotDataHeader(
    currentMap: Record<string, any>,
    header: PivotDataHeader,
    headerIndex: number,
    level: number,
    maxLevels: number,
    colors: string[],
    valueColors: string[],
    valueTitles: string[],
    attributes: Attribute[],
    additionalData: {maxIndex: number}
  ) {
    if (level === maxLevels) {
      if ((valueTitles || []).length > 1) {
        header.children = valueTitles.map((title, index) => ({
          title,
          targetIndex: headerIndex + index,
          color: valueColors[index],
          isValueHeader: true,
        }));
        additionalData.maxIndex = Math.max(additionalData.maxIndex, headerIndex + valueTitles.length - 1);
      }
      return;
    }

    header.children = [];
    let currentIndex = headerIndex;
    Object.keys(currentMap).forEach((title, index) => {
      const attribute = attributes && attributes[level];
      if (level + 1 === maxLevels && (valueTitles || []).length <= 1) {
        header.children.push({
          title,
          targetIndex: currentIndex,
          color: colors[level],
          constraint: attribute?.constraint || new UnknownConstraint(),
          isValueHeader: false,
          attributeName: attribute?.name,
        });
        additionalData.maxIndex = Math.max(additionalData.maxIndex, currentIndex);
      } else {
        header.children.push({
          title,
          color: colors[level],
          constraint: attribute?.constraint || new UnknownConstraint(),
          isValueHeader: false,
          attributeName: attribute?.name,
        });
      }

      this.iterateThroughPivotDataHeader(
        currentMap[title],
        header.children[index],
        currentIndex,
        level + 1,
        maxLevels,
        colors,
        valueColors,
        valueTitles,
        attributes,
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

        if (isValueAggregation(pivotAttribute.aggregation)) {
          constraints.push(this.pivotAttributeConstraint(pivotAttribute));
        } else {
          constraints.push(new NumberConstraint({}));
        }
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
    aggregatedData: AggregatedMapData
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
      const attribute = this.pivotAttributeAttribute(valueAttribute);
      return aggregateDataResources(valueAttribute.aggregation, dataResources, attribute, true);
    }

    return null;
  }

  private findAttributeByPivotAttribute(valueAttribute: PivotAttribute): Attribute {
    const resource = this.findResourceByPivotAttribute(valueAttribute);
    return findAttribute(resource && resource.attributes, valueAttribute.attributeId);
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

function getPivotStemConfigType(stemConfig: PivotStemConfig): PivotConfigType {
  const rowLength = (stemConfig.rowAttributes || []).length;
  const columnLength = (stemConfig.columnAttributes || []).length;

  if (rowLength > 0 && columnLength > 0) {
    return PivotConfigType.RowsAndColumns;
  } else if (rowLength > 0) {
    return PivotConfigType.Rows;
  } else if (columnLength > 0) {
    return PivotConfigType.Columns;
  }
  return PivotConfigType.Values;
}

function canMergeConfigsByType(type: PivotConfigType, c1: PivotStemConfig, c2: PivotStemConfig): boolean {
  if (type === PivotConfigType.Rows) {
    return (c1.rowAttributes || []).length === (c2.rowAttributes || []).length;
  } else if (type === PivotConfigType.Columns) {
    return (c1.columnAttributes || []).length === (c2.columnAttributes || []).length;
  }
  return (
    (c1.rowAttributes || []).length === (c2.rowAttributes || []).length &&
    (c1.columnAttributes || []).length === (c2.columnAttributes || []).length
  );
}
