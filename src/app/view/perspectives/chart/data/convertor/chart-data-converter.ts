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
import {Constraint} from '../../../../../core/model/constraint';
import {PercentageConstraint} from '../../../../../core/model/constraint/percentage.constraint';
import {UnknownConstraint} from '../../../../../core/model/constraint/unknown.constraint';
import {ConstraintData, ConstraintType} from '../../../../../core/model/data/constraint';
import {
  ConstraintConfig,
  DateTimeConstraintConfig,
  DurationConstraintConfig,
} from '../../../../../core/model/data/constraint-config';
import {AttributesResource, AttributesResourceType} from '../../../../../core/model/resource';
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
import {Query} from '../../../../../core/store/navigation/query/query';
import {SelectItemWithConstraintFormatter} from '../../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {
  isArray,
  isNotNullOrUndefined,
  isNullOrUndefined,
  isNumeric,
  toNumber,
} from '../../../../../shared/utils/common.utils';
import {getDurationSaveValue} from '../../../../../shared/utils/constraint/duration-constraint.utils';
import {decimalUserToStore} from '../../../../../shared/utils/data.utils';
import {aggregateDataValues, isValueAggregation} from '../../../../../shared/utils/data/data-aggregation';
import {
  AggregatedMapData,
  AggregatedDataValues,
  DataAggregator,
  DataAggregatorAttribute,
} from '../../../../../shared/utils/data/data-aggregator';
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
import {parseMomentDate} from '../../../../../shared/utils/date.utils';

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

  constructor(private constraintItemsFormatter: SelectItemWithConstraintFormatter) {
    this.dataAggregator = new DataAggregator((value, constraint, data, aggregatorAttribute) =>
      this.formatDataAggregatorValue(value, constraint, data, aggregatorAttribute)
    );
  }

  private formatDataAggregatorValue(
    value: any,
    constraint: Constraint,
    constraintData: ConstraintData,
    aggregatorAttribute: DataAggregatorAttribute
  ): any {
    const overrideConstraint = aggregatorAttribute.data && (aggregatorAttribute.data as Constraint);
    const chartConstraint =
      overrideConstraint && this.constraintItemsFormatter.checkValidConstraintOverride(constraint, overrideConstraint);
    return this.formatChartValue(value, chartConstraint || constraint, constraintData);
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
    this.dataAggregator.updateData(
      collections,
      sortedDocuments,
      linkTypes,
      linkInstances,
      query.stems && query.stems[0],
      constraintData
    );
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

      const multiplier = asc ? 1 : -1;
      const aValue = constraint.createDataValue(a.data[sortAxis.attributeId], this.constraintData);
      const bValue = constraint.createDataValue(b.data[sortAxis.attributeId], this.constraintData);
      return aValue.compareTo(bValue) * multiplier;
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
      constraintData: this.constraintData,
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
      const value = xAxis ? dataObject.data[xAxis.attributeId] : yAxis ? dataObject.data[yAxis.attributeId] : null;
      const values = isArray(value) ? value : [value];
      for (let i = 0; i < values.length; i++) {
        const formattedValue = this.formatChartAxisValue(values[i], definedAxis);
        if (isNullOrUndefined(formattedValue) || actualValues.has(formattedValue)) {
          continue;
        }

        const id = draggable ? dataObject?.id : null;

        isNum = isNum && isNumeric(formattedValue);

        points.push({id, x: xAxis ? formattedValue : null, y: yAxis ? formattedValue : null});
        actualValues.add(formattedValue);
      }
    }

    const name = yAxis && this.attributeNameForAxis(yAxis);

    const axis = {
      category: this.getAxisCategory(isNum, constraint),
      config: this.createChartConstraintConfig(constraint),
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
    const constraint = attribute && attribute.constraint;
    const overrideConstraint = axis.constraint;
    const chartConstraint =
      overrideConstraint && this.constraintItemsFormatter.checkValidConstraintOverride(constraint, overrideConstraint);

    return chartConstraint || constraint || new UnknownConstraint();
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
    aggregatedData: AggregatedMapData,
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
        yValue = isValueAggregation(aggregation) ? this.formatChartAxisValue(yValue, yAxis) : yValue;
        if (isNotNullOrUndefined(yValue)) {
          const id =
            canDragAxis && valueObjects.length === 1 && isValueAggregation(aggregation) ? valueObjects[0].id : null;
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
          config: this.createChartConstraintConfig(yConstraint),
        },
        xAxis: {
          category: this.getAxisCategory(false, xConstraint),
          config: this.createChartConstraintConfig(xConstraint),
        },
        yAxisType,
        draggable,
        resourceType: yAxis.resourceType,
      });
      colorAlpha -= colorAlphaStep;
    }

    return sets;
  }

  private createChartConstraintConfig(constraint: Constraint): ConstraintConfig {
    return constraint && constraint.config;
  }

  private getAxisColor(axis: ChartAxis): string {
    const collectionResource = this.dataAggregator.getNextCollectionResource(axis.resourceIndex) as Collection;
    return collectionResource && collectionResource.color;
  }

  private formatChartAxisValue(value: any, axis: ChartAxis): any {
    const constraint = this.constraintForAxis(axis);
    return this.formatChartValue(value, constraint, this.constraintData);
  }

  private formatChartValue(value: any, constraint: Constraint, constraintData: ConstraintData): any {
    if (isNullOrUndefined(value)) {
      return value;
    }

    switch (constraint && constraint.type) {
      case ConstraintType.Select:
      case ConstraintType.User:
      case ConstraintType.Text:
        return constraint.createDataValue(value, this.constraintData).preview();
      case ConstraintType.DateTime:
        return this.formatDateTimeValue(value, constraint.config as DateTimeConstraintConfig);
      case ConstraintType.Percentage:
        return this.formatPercentageValue(value, constraint as PercentageConstraint);
      case ConstraintType.Duration:
        const durationUnitsMap = constraintData && constraintData.durationUnitsMap;
        const durationValue = getDurationSaveValue(
          value,
          constraint.config as DurationConstraintConfig,
          durationUnitsMap
        );
        return isNumeric(durationValue) && toNumber(durationValue) >= 0 ? toNumber(durationValue) : null;
      default:
        return (constraint || new UnknownConstraint())
          .createDataValue(value, constraintData || this.constraintData)
          .serialize();
    }
  }

  private formatDateTimeValue(value: any, config: DateTimeConstraintConfig): string {
    const format = config && config.format;
    const momentDate = parseMomentDate(value, format);
    return momentDate.format(convertChartDateFormat(format));
  }

  private formatPercentageValue(value: any, constraint: PercentageConstraint): string {
    const percentageValue = constraint.createDataValue(value).format('');
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
      case ConstraintType.Duration:
        return ChartAxisCategory.Duration;
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
    const color = this.collections?.[0]?.color;
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
    return {sets: [emptySet], type: config.type, constraintData: this.constraintData};
  }
}
