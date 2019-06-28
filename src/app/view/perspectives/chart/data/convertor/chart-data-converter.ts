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

import {Injectable} from '@angular/core';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';
import {Constraint, ConstraintData, ConstraintType} from '../../../../../core/model/data/constraint';
import {DateTimeConstraintConfig, PercentageConstraintConfig} from '../../../../../core/model/data/constraint-config';
import {ChartAxis, ChartAxisType, ChartConfig, ChartSortType, ChartType} from '../../../../../core/store/charts/chart';
import {Attribute, Collection} from '../../../../../core/store/collections/collection';
import {
  findAttribute,
  isCollectionAttributeEditable,
  isLinkTypeAttributeEditable,
} from '../../../../../core/store/collections/collection.util';
import {DocumentModel} from '../../../../../core/store/documents/document.model';
import {LinkInstance} from '../../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {Query} from '../../../../../core/store/navigation/query';
import {isNotNullOrUndefined, isNullOrUndefined, isNumeric} from '../../../../../shared/utils/common.utils';
import {
  decimalUserToStore,
  formatDataValue,
  formatPercentageDataValue,
  parseMomentDate,
} from '../../../../../shared/utils/data.utils';
import {compareDataValues} from '../../../../../shared/utils/data/data-compare.utils';
import {resetUnusedMomentPart} from '../../../../../shared/utils/date.utils';
import {hex2rgba} from '../../../../../shared/utils/html-modifier';
import {mergePermissions} from '../../../../../shared/utils/resource.utils';
import {
  ChartAxisCategory,
  ChartData,
  ChartDataSet,
  ChartPoint,
  ChartYAxisType,
  convertChartDateFormat,
} from './chart-data';
import {AggregatedData, AggregatedDataValues, DataAggregator} from '../../../../../shared/utils/data/data-aggregator';
import {AttributesResource, AttributesResourceType} from '../../../../../core/model/resource';
import {aggregateDataValues, isValueAggregation} from '../../../../../shared/utils/data/data-aggregation';

@Injectable()
export class ChartDataConverter {
  private collections: Collection[];
  private linkTypes: LinkType[];
  private permissions: Record<string, AllowedPermissions>;
  private query: Query;
  private constraintData: ConstraintData;

  private dataAggregator: DataAggregator;

  private currentConfig: ChartConfig;
  private y1Sets: ChartDataSet[];
  private y2Sets: ChartDataSet[];

  constructor() {
    this.dataAggregator = new DataAggregator((value, constraint, data) =>
      this.formatChartValue(value, constraint, data)
    );
  }

  public updateData(
    collections: Collection[],
    documents: DocumentModel[],
    permissions: Record<string, AllowedPermissions>,
    query: Query,
    config: ChartConfig,
    linkTypes?: LinkType[],
    linkInstances?: LinkInstance[],
    constraintData?: ConstraintData
  ) {
    this.collections = collections;
    this.linkTypes = linkTypes;
    this.permissions = permissions;
    this.query = query;
    this.constraintData = constraintData;

    const sortedDocuments = this.sortDocuments(documents, config);
    this.dataAggregator.updateData(collections, sortedDocuments, linkTypes, linkInstances, query, constraintData);
  }

  private sortDocuments(documents: DocumentModel[], config: ChartConfig): DocumentModel[] {
    const sort = config.sort;
    const xAxis = config.axes[ChartAxisType.X];
    const sortAxis = (sort && sort.axis) || xAxis;
    if (!sortAxis) {
      return [...documents];
    }

    const asc = !sort || sort.type === ChartSortType.Ascending;
    const constraint = this.constraintForAxis(sortAxis);
    return [...documents].sort((a, b) => {
      if (a.collectionId !== b.collectionId || a.collectionId !== sortAxis.resourceId) {
        return 0;
      }

      return compareDataValues(a.data[sortAxis.attributeId], b.data[sortAxis.attributeId], constraint, asc);
    });
  }

  public convertType(type: ChartType): ChartData {
    if (this.areSetsEmpty()) {
      return this.createEmptyData({...this.currentConfig, type});
    }

    this.currentConfig = {...this.currentConfig, type};
    return {
      type,
      sets: [...(this.y1Sets || []), ...(this.y2Sets || [])],
    };
  }

  private areSetsEmpty(): boolean {
    return (!this.y1Sets || this.y1Sets.length === 0) && (!this.y2Sets || this.y2Sets.length === 0);
  }

  public convert(config: ChartConfig): ChartData {
    const xAxis = config.axes[ChartAxisType.X];
    const y1Axis = config.axes[ChartAxisType.Y1];
    const y2Axis = config.axes[ChartAxisType.Y2];

    if (!xAxis && !y1Axis && !y2Axis) {
      return this.createEmptyData(config);
    }

    if (y1Axis && y2Axis) {
      this.y1Sets = this.convertAxis(config, ChartAxisType.Y1);
      this.y2Sets = this.convertAxis(config, ChartAxisType.Y2);
      this.currentConfig = config;
      return this.convertType(config.type);
    } else if (!y2Axis && (xAxis || y1Axis)) {
      this.y1Sets = this.convertAxis(config, ChartAxisType.Y1);
      this.y2Sets = [];
      this.currentConfig = config;
      return this.convertType(config.type);
    } else if (xAxis || y2Axis) {
      this.y1Sets = [];
      this.y2Sets = this.convertAxis(config, ChartAxisType.Y2);
      this.currentConfig = config;
      return this.convertType(config.type);
    }

    return this.createEmptyData(config);
  }

  private convertAxis(config: ChartConfig, yAxisType: ChartYAxisType): ChartDataSet[] {
    const xAxis = config.axes[ChartAxisType.X];
    const yAxis = config.axes[yAxisType];

    if (!xAxis || !yAxis) {
      return this.convertAxisSimple(yAxisType, xAxis, yAxis);
    }

    return this.convertAxisWithAggregation(config, yAxisType);
  }

  private convertAxisSimple(yAxisType: ChartYAxisType, xAxis: ChartAxis, yAxis: ChartAxis): ChartDataSet[] {
    const definedAxis = yAxis || xAxis;
    if (!definedAxis) {
      return [];
    }

    let isNum = true;
    const actualValues = new Set();
    const draggable = this.canDragAxis(yAxis);
    const points: ChartPoint[] = [];

    const attributesResource = this.attributesResourceForAxis(definedAxis);
    const constraint = this.constraintForAxis(definedAxis);

    const dataResources = this.dataAggregator.getDataResources(definedAxis.resourceIndex);

    for (const dataObject of dataResources) {
      let xValue = xAxis && dataObject.data[xAxis.attributeId];
      let yValue = yAxis && dataObject.data[yAxis.attributeId];
      if (isNullOrUndefined(xValue || yValue)) {
        continue;
      }

      // we know that x or y is set
      if (isNotNullOrUndefined(xValue || yValue) && actualValues.has(xValue || yValue)) {
        continue;
      }

      const id = draggable ? dataObject.id : null;

      if (isNotNullOrUndefined(xValue)) {
        xValue = this.formatChartValue(xValue, constraint);
      }
      if (isNotNullOrUndefined(yValue)) {
        yValue = this.formatChartValue(yValue, constraint);
      }
      isNum = isNum && isNumeric(xValue || yValue);

      points.push({id, x: xValue, y: yValue});
      actualValues.add(xValue || yValue);
    }

    const name = yAxis && this.attributeNameForAxis(yAxis);

    const axis = {
      category: this.getAxisCategory(isNum, constraint),
      config: constraint && constraint.config,
    };

    const dataSet: ChartDataSet = {
      id: (yAxis && yAxis.attributeId) || null,
      points,
      color: (<Collection>attributesResource).color,
      yAxis: yAxis && axis,
      xAxis: xAxis && axis,
      yAxisType,
      name,
      draggable,
      resourceType: definedAxis.resourceType,
    };
    return [dataSet];
  }

  private attributesResourceForAxis(axis: ChartAxis): AttributesResource {
    if (axis.resourceType === AttributesResourceType.Collection) {
      return (this.collections || []).find(coll => coll.id === axis.resourceId);
    } else if (axis.resourceType === AttributesResourceType.LinkType) {
      return (this.linkTypes || []).find(lt => lt.id === axis.resourceId);
    }
    return null;
  }

  private attributeForAxis(axis: ChartAxis): Attribute {
    const attributesResource = this.attributesResourceForAxis(axis);
    return attributesResource && findAttribute(attributesResource.attributes, axis.attributeId);
  }

  private constraintForAxis(axis: ChartAxis): Constraint {
    const attribute = this.attributeForAxis(axis);
    return attribute && attribute.constraint;
  }

  private convertAxisWithAggregation(config: ChartConfig, yAxisType: ChartYAxisType): ChartDataSet[] {
    const xAxis = config.axes[ChartAxisType.X];
    const yAxis = config.axes[yAxisType];
    const yName = config.names && config.names[yAxisType];

    const rowAttributes = [xAxis, yName]
      .filter(axis => !!axis)
      .map(axis => ({attributeId: axis.attributeId, resourceIndex: axis.resourceIndex}));
    const valueAttributes = [{attributeId: yAxis.attributeId, resourceIndex: yAxis.resourceIndex}];

    const aggregatedData = this.dataAggregator.aggregate(rowAttributes, [], valueAttributes);

    return this.convertAggregatedData(aggregatedData, config, yAxisType);
  }

  private convertAggregatedData(
    aggregatedData: AggregatedData,
    config: ChartConfig,
    yAxisType: ChartYAxisType
  ): ChartDataSet[] {
    const xEntries = Object.keys(aggregatedData.map);
    if (xEntries.length === 0) {
      return [];
    }

    const xAxis = config.axes[ChartAxisType.X];
    const yAxis = config.axes[yAxisType];

    const isNumericMap: Record<string, boolean> = {};
    const pointsMap: Record<string, ChartPoint[]> = {};
    let draggable = false;

    const canDragAxis = this.canDragAxis(yAxis);
    const xConstraint = this.constraintForAxis(xAxis);
    const yConstraint = this.constraintForAxis(yAxis);
    const yAxisName = this.attributeNameForAxis(yAxis);

    const isNestedMap = aggregatedData.rowLevels > 1;

    for (const xEntry of xEntries) {
      const map = isNestedMap ? aggregatedData.map[xEntry] : aggregatedData.map;
      const keys = isNestedMap ? Object.keys(map) : [xEntry];
      const helperMapKeys = isNestedMap ? keys : [yAxisName];

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const helperMapKey = helperMapKeys[i];

        if (!pointsMap[helperMapKey]) {
          pointsMap[helperMapKey] = [];
          isNumericMap[helperMapKey] = true;
        }

        // in this case there should be only one value, because in chart we select maximum one value on y axis
        const dataAggregationValues: AggregatedDataValues = map[key][0];
        if (!dataAggregationValues) {
          continue;
        }

        const valueObjects = dataAggregationValues.objects
          .map(object => ({id: object.id, value: object.data[yAxis.attributeId]}))
          .filter(obj => obj.value !== '' && isNotNullOrUndefined(obj.value));

        const values = valueObjects.map(obj => obj.value);
        const aggregation = config.aggregations && config.aggregations[yAxisType];
        let yValue = aggregateDataValues(aggregation, values, yConstraint);
        if (isNotNullOrUndefined(yValue)) {
          const id =
            canDragAxis && valueObjects.length === 1 && isValueAggregation(aggregation) ? valueObjects[0].id : null;
          yValue = isValueAggregation(aggregation) ? this.formatChartValue(yValue, yConstraint) : yValue;
          const isNum = isNumeric(yValue);

          isNumericMap[helperMapKey] = isNumericMap[helperMapKey] && isNum;
          pointsMap[helperMapKey].push({id, x: xEntry, y: yValue});
          draggable = draggable || isNotNullOrUndefined(id);
        }
      }
    }

    const sets: ChartDataSet[] = [];
    const legendEntriesNames = Object.keys(pointsMap);
    let colorAlpha = 100;
    const colorAlphaStep = 70 / Math.max(1, legendEntriesNames.length - 1); // min alpha is 30

    const axisColor = this.getAxisColor(yAxis);
    for (let i = 0; i < legendEntriesNames.length; i++) {
      const name = legendEntriesNames[i];
      const color = hex2rgba(axisColor, colorAlpha / 100);
      sets.push({
        id: this.yAxisCollectionId(config, yAxisType),
        points: pointsMap[name],
        color,
        name,
        yAxis: {
          category: this.getAxisCategory(isNumericMap[name], yConstraint),
          config: yConstraint && yConstraint.config,
        },
        xAxis: {
          category: this.getAxisCategory(false, xConstraint),
          config: xConstraint && xConstraint.config,
        },
        yAxisType,
        draggable,
        resourceType: yAxis.resourceType,
      });
      colorAlpha -= colorAlphaStep;
    }

    return sets;
  }

  private getAxisColor(axis: ChartAxis): string {
    const collectionResource = this.dataAggregator.getNextCollectionResource(axis.resourceIndex) as Collection;
    return collectionResource && collectionResource.color;
  }

  private formatChartValue(value: any, constraint: Constraint, constraintData?: ConstraintData): any {
    if (!constraint) {
      return formatDataValue(value);
    }

    switch (constraint.type) {
      case ConstraintType.DateTime:
        return this.formatDateTimeValue(value, constraint.config as DateTimeConstraintConfig);
      case ConstraintType.Percentage:
        return this.formatPercentageValue(value, constraint.config as PercentageConstraintConfig);
      default:
        return formatDataValue(value, constraint, constraintData || this.constraintData);
    }
  }

  private formatDateTimeValue(value: any, config: DateTimeConstraintConfig): string {
    const format = config && config.format;
    const momentDate = parseMomentDate(value, format);
    const resetDate = resetUnusedMomentPart(momentDate, format);
    return resetDate.format(convertChartDateFormat(format));
  }

  private formatPercentageValue(value: any, config: PercentageConstraintConfig): string {
    const percentageValue = formatPercentageDataValue(value, config);
    return decimalUserToStore(percentageValue);
  }

  private getAxisCategory(numeric: boolean, constraint: Constraint): ChartAxisCategory {
    if (!constraint) {
      return numeric ? ChartAxisCategory.Number : ChartAxisCategory.Text;
    }

    switch (constraint.type) {
      case ConstraintType.DateTime:
        return ChartAxisCategory.Date;
      case ConstraintType.Number:
        return ChartAxisCategory.Number;
      case ConstraintType.Percentage:
        return ChartAxisCategory.Percentage;
      default:
        return numeric ? ChartAxisCategory.Number : ChartAxisCategory.Text;
    }
  }

  private canDragAxis(yAxis: ChartAxis): boolean {
    if (!yAxis) {
      return false;
    }

    if (yAxis.resourceType === AttributesResourceType.Collection) {
      return this.canDragCollectionAxis(yAxis.resourceId, yAxis.attributeId);
    } else if (yAxis.resourceType === AttributesResourceType.LinkType) {
      return this.canDragLinkAxis(yAxis.resourceId, yAxis.attributeId);
    }

    return false;
  }

  private canDragCollectionAxis(collectionId: string, attributeId: string): boolean {
    const permission = this.permissions && this.permissions[collectionId];
    if (!permission || !permission.writeWithView) {
      return false;
    }

    const collection = this.collections && this.collections.find(c => c.id === collectionId);
    return isCollectionAttributeEditable(attributeId, collection, this.permissions[collectionId] || {}, this.query);
  }

  private canDragLinkAxis(linkTypeId: string, attributeId: string): boolean {
    const linkType = this.linkTypes && this.linkTypes.find(lt => lt.id === linkTypeId);
    if (!linkType) {
      return false;
    }

    const permission1 = this.permissions && this.permissions[linkType.collectionIds[0]];
    const permission2 = this.permissions && this.permissions[linkType.collectionIds[1]];
    if (!permission1 || !permission2 || !permission1.writeWithView || !permission2.writeWithView) {
      return false;
    }

    const mergedPermissions = mergePermissions(permission1, permission2);

    return isLinkTypeAttributeEditable(attributeId, linkType, mergedPermissions, this.query);
  }

  private attributeNameForAxis(axis: ChartAxis): string {
    const attribute = this.attributeForAxis(axis);
    return attribute && attribute.name;
  }

  private yAxisCollectionId(config: ChartConfig, yAxisType: ChartYAxisType): string {
    const yAxis = config.axes[yAxisType];
    return (yAxis && yAxis.attributeId) || null;
  }

  public convertAxisType(config: ChartConfig, type: ChartYAxisType): ChartData {
    const xAxis = config.axes[ChartAxisType.X];
    const yAxis = config.axes[type];

    const otherSets = type === ChartAxisType.Y1 ? this.y2Sets : this.y1Sets;
    const otherSetsAreEmpty = !otherSets || otherSets.length === 0;

    const sets = ((yAxis || (xAxis && otherSetsAreEmpty)) && this.convertAxis(config, type)) || [];
    if (type === ChartAxisType.Y1) {
      this.y1Sets = sets;
    } else {
      this.y2Sets = sets;
    }

    const otherYAxis = config.axes[type === ChartAxisType.Y1 ? ChartAxisType.Y2 : ChartAxisType.Y1];
    sets.length > 0 && !otherYAxis && this.clearOtherSetsByType(type);

    this.currentConfig = config;
    return this.convertType(config.type);
  }

  private clearOtherSetsByType(type: ChartAxisType) {
    if (type === ChartAxisType.Y1) {
      this.y2Sets = [];
    } else {
      this.y1Sets = [];
    }
  }

  private createEmptyData(config: ChartConfig): ChartData {
    const color = this.collections && this.collections[0] && this.collections[0].color;
    const emptySet: ChartDataSet = {
      yAxisType: ChartAxisType.Y1,
      yAxis: {
        category: ChartAxisCategory.Number,
      },
      name: '',
      draggable: false,
      points: [],
      id: null,
      resourceType: AttributesResourceType.Collection,
      color,
    };

    this.y1Sets = [emptySet];
    this.y2Sets = [];
    this.currentConfig = config;
    return {sets: [emptySet], type: config.type};
  }
}
