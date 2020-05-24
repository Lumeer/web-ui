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
import {UnknownConstraint} from '../../../../../core/model/constraint/unknown.constraint';
import {ConstraintData, ConstraintType} from '../../../../../core/model/data/constraint';
import {AttributesResourceType} from '../../../../../core/model/resource';
import {ChartAxis, ChartAxisType, ChartConfig, ChartSortType, ChartType} from '../../../../../core/store/charts/chart';
import {Attribute, Collection} from '../../../../../core/store/collections/collection';
import {findAttribute,} from '../../../../../core/store/collections/collection.util';
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
import {aggregateDataValues, isValueAggregation} from '../../../../../shared/utils/data/data-aggregation';
import {DataAggregatorAttribute,} from '../../../../../shared/utils/data/data-aggregator';
import {hex2rgba} from '../../../../../shared/utils/html-modifier';
import {ChartAxisData, ChartData, ChartDataSet, ChartPoint, ChartYAxisType} from './chart-data';
import {
  DataObjectAggregator,
  DataObjectAttribute,
  DataObjectInfo
} from '../../../../../shared/utils/data/data-object-aggregator';
import {uniqueValues} from '../../../../../shared/utils/array.utils';
import {DurationConstraint} from '../../../../../core/model/constraint/duration.constraint';
import {createRange} from '../../visualizer/plot-maker/plot-util';
import {NumberConstraint} from '../../../../../core/model/constraint/number.constraint';

enum DataObjectInfoKeyType {
  X = 'x',
  Y = 'y',
  Name = 'name',
  Color = 'color',
}

interface ChartConvertData {
  sets: ChartDataSet[];
  xAxisHelperData?: ChartAxisHelperData;
  yAxisHelperData?: ChartAxisHelperData;
}

interface ChartAxisHelperData {
  constraint: Constraint;
  values: any[];
  valuesAreNumeric: boolean;
}

@Injectable()
export class ChartDataConverter {
  private constraintData: ConstraintData;

  private currentConfig: ChartConfig;
  private y1Sets: ChartDataSet[];
  private y2Sets: ChartDataSet[];

  private xAxisHelperData1: ChartAxisHelperData;
  private xAxisHelperData2: ChartAxisHelperData;
  private y1AxisHelperData: ChartAxisHelperData;
  private y2AxisHelperData: ChartAxisHelperData;

  private dataObjectAggregator = new DataObjectAggregator<string>(
    (value, constraint, data, aggregatorAttribute) =>
      this.formatDataAggregatorValue(value, constraint, data, aggregatorAttribute)
  );

  constructor(private constraintItemsFormatter: SelectItemWithConstraintFormatter) {
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
    const finalConstraint = chartConstraint || constraint || new UnknownConstraint();
    return finalConstraint.createDataValue(value, constraintData).format();
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
    this.constraintData = constraintData;

    this.dataObjectAggregator.updateData(
      collections,
      this.sortDocuments(documents, config, collections, linkTypes, constraintData),
      linkTypes,
      linkInstances,
      query.stems?.[0],
      permissions,
      constraintData
    );
  }

  private sortDocuments(documents: DocumentModel[], config: ChartConfig, collections: Collection[], linkTypes: LinkType[], constraintData: ConstraintData): DocumentModel[] {
    const sort = config.sort;
    const sortAxis = sort?.axis || config.axes?.[ChartAxisType.X];
    if (!sortAxis) {
      return [...documents];
    }

    const asc = !sort || sort.type === ChartSortType.Ascending;

    const resource = sortAxis.resourceType === AttributesResourceType.Collection ? collections.find(coll => coll.id === sortAxis.resourceId)
      : linkTypes.find(lt => lt.id === sortAxis.resourceId);
    const attribute = findAttribute(resource?.attributes, sortAxis.attributeId);

    const constraint = this.constraintForAttribute(attribute, sortAxis.constraint);
    return [...documents].sort((a, b) => {
      if (a.collectionId !== b.collectionId || a.collectionId !== sortAxis.resourceId) {
        return 0;
      }

      const multiplier = asc ? 1 : -1;
      const aValue = constraint.createDataValue(a.data[sortAxis.attributeId], constraintData);
      const bValue = constraint.createDataValue(b.data[sortAxis.attributeId], constraintData);
      return aValue.compareTo(bValue) * multiplier;
    });
  }

  public convertType(type: ChartType): ChartData {
    if (this.areSetsEmpty()) {
      return this.createEmptyData({...this.currentConfig, type});
    }

    this.currentConfig = {...this.currentConfig, type};

    const xAxis = this.createAxisData(this.xAxisHelperData1, this.xAxisHelperData2);
    const range = this.currentConfig.lockAxes ? this.createAxesRange(this.y1AxisHelperData, this.y2AxisHelperData) : null;
    const y1AxisData = this.y1AxisHelperData && {...this.createAxisData(this.y1AxisHelperData), range};
    const y2AxisData = this.y2AxisHelperData && {...this.createAxisData(this.y2AxisHelperData), range};

    return {
      type,
      sets: [...(this.y1Sets || []), ...(this.y2Sets || [])],
      xAxisData: {...xAxis, rangeSlider: this.currentConfig.rangeSlider},
      y1AxisData, y2AxisData,
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
      const {sets: y1Sets, xAxisHelperData: xAxisHelperData1, yAxisHelperData: y1AxisHelperData} = this.convertAxis(config, ChartAxisType.Y1);
      const {sets: y2Sets, xAxisHelperData: xAxisHelperData2, yAxisHelperData: y2AxisHelperData} = this.convertAxis(config, ChartAxisType.Y2);
      this.xAxisHelperData1 = xAxisHelperData1;
      this.xAxisHelperData2 = xAxisHelperData2;
      this.y1AxisHelperData = y1AxisHelperData;
      this.y2AxisHelperData = y2AxisHelperData;
      this.y1Sets = y1Sets;
      this.y2Sets = y2Sets;
      this.currentConfig = config;
      return this.convertType(config.type);
    } else if (!y2Axis && (xAxis || y1Axis)) {
      const {sets: y1Sets, xAxisHelperData, yAxisHelperData: y1AxisHelperData} = this.convertAxis(config, ChartAxisType.Y1);
      this.xAxisHelperData1 = xAxisHelperData;
      this.y1Sets = y1Sets;
      this.y1AxisHelperData = y1AxisHelperData;
      this.currentConfig = config;
      this.clearOtherSetsByType(ChartAxisType.Y1);
      return this.convertType(config.type);
    } else if (xAxis || y2Axis) {
      const {sets: y2Sets, xAxisHelperData, yAxisHelperData: y2AxisHelperData} = this.convertAxis(config, ChartAxisType.Y2);
      this.xAxisHelperData2 = xAxisHelperData;
      this.y2Sets = y2Sets;
      this.y2AxisHelperData = y2AxisHelperData;
      this.currentConfig = config;
      this.clearOtherSetsByType(ChartAxisType.Y2);
      return this.convertType(config.type);
    }

    return this.createEmptyData(config);
  }

  private createAxesRange(y1HelperData: ChartAxisHelperData, y2HelperData: ChartAxisHelperData): [number, number] {
    if (!y1HelperData || !y2HelperData) {
      return null;
    }
    const constraint1Type = this.getAxisConstraintType(y1HelperData.valuesAreNumeric, y1HelperData.constraint);
    const constraint2Type = this.getAxisConstraintType(y2HelperData.valuesAreNumeric, y2HelperData.constraint);
    if (constraint1Type === constraint2Type) {
      const values = [...y1HelperData.values, y2HelperData.values];
      return createRange(values);
    }
    return null;
  }

  private createAxisData(helperData: ChartAxisHelperData, helperData2?: ChartAxisHelperData): ChartAxisData {
    if (!helperData && !helperData2) {
      return {constraintType: ConstraintType.Unknown};
    }

    const constraint = helperData?.constraint || helperData2?.constraint;
    const isNumeric = (!helperData || helperData.valuesAreNumeric) && (!helperData2 || helperData2.valuesAreNumeric);
    const constraintType = this.getAxisConstraintType(isNumeric, constraint);

    let formatter: (x: number) => string;
    if (constraintType === ConstraintType.Percentage) {
      formatter = x => constraint.createDataValue(x).title();
    } else if (constraintType === ConstraintType.Number) {
      const numberConstraint = <NumberConstraint>constraint;
      formatter = x => numberConstraint.createDataValue(x).title(2);
    } else if (constraintType === ConstraintType.Duration) {
      const durationConstraint = <DurationConstraint>constraint;
      formatter = x => durationConstraint.createDataValue(x, this.constraintData).title(2);
    }

    return {constraintType, formatter};
  }

  private convertAxis(config: ChartConfig, yAxisType: ChartYAxisType): ChartConvertData {
    const xAxis = config.axes[ChartAxisType.X];
    const yAxis = config.axes[yAxisType];

    if (!xAxis || !yAxis) {
      return this.convertAxisSimple(yAxisType, xAxis, yAxis);
    }

    return this.convertAxisWithAggregation(config, yAxisType);
  }

  private convertAxisSimple(yAxisType: ChartYAxisType, xAxis: ChartAxis, yAxis: ChartAxis): ChartConvertData {
    const definedAxis = yAxis || xAxis;
    if (!definedAxis) {
      return {sets: []};
    }

    const actualValues = new Set();
    const draggable = this.canDragAxis(yAxis);
    const constraint = this.constraintForAxis(definedAxis);
    const points: ChartPoint[] = [];
    let isNum = true;

    const dataResources = this.dataObjectAggregator.getDataResources(definedAxis);
    const color = this.dataObjectAggregator.getAttributeResourceColor(definedAxis);

    for (const dataObject of dataResources) {
      const value = xAxis ? dataObject.data[xAxis.attributeId] : yAxis ? dataObject.data[yAxis.attributeId] : null;
      const values = isArray(value) ? value : [value];
      for (let i = 0; i < values.length; i++) {
        const formattedValue = this.formatChartAxisValue(values[i], definedAxis);
        if (isNullOrUndefined(formattedValue) || actualValues.has(formattedValue)) {
          continue;
        }

        const id = draggable ? dataObject?.id : null;
        const title = this.formatPointTitleValue(values[i], definedAxis);
        isNum = isNum && isNumeric(formattedValue);
        points.push({id, x: xAxis ? formattedValue : null, y: yAxis ? formattedValue : null, color, title});
        actualValues.add(formattedValue);
      }
    }

    const name = this.attributeNameForAxis(yAxis);
    const axisHelperData: ChartAxisHelperData = {constraint, valuesAreNumeric: isNum, values: Array.from(actualValues)};

    const dataSet: ChartDataSet = {
      id: yAxis?.attributeId,
      points,
      yAxisType,
      name,
      draggable,
      resourceType: definedAxis.resourceType
    };
    return {
      sets: [dataSet],
      xAxisHelperData: xAxis ? axisHelperData : null,
      yAxisHelperData: yAxis ? axisHelperData : null
    };
  }

  private getAxisConstraintType(numeric: boolean, constraint: Constraint): ConstraintType {
    if (constraint && constraint.type !== ConstraintType.Unknown) {
      return constraint.type;
    }
    return numeric ? ConstraintType.Number : ConstraintType.Unknown;
  }

  private attributeForAxis(axis: ChartAxis): Attribute {
    const attributesResource = this.dataObjectAggregator.getResource(axis);
    return findAttribute(attributesResource?.attributes, axis.attributeId);
  }

  private constraintForAxis(axis: ChartAxis): Constraint {
    const attribute = this.attributeForAxis(axis);
    return this.constraintForAttribute(attribute, axis?.constraint);
  }

  private constraintForAttribute(attribute: Attribute, overrideConstraint: Constraint): Constraint {
    const constraint = attribute?.constraint;
    const chartConstraint =
      overrideConstraint && this.constraintItemsFormatter.checkValidConstraintOverride(constraint, overrideConstraint);

    return chartConstraint || constraint || new UnknownConstraint();
  }

  private convertAxisWithAggregation(config: ChartConfig, yAxisType: ChartYAxisType): ChartConvertData {
    const xAxis = config.axes[ChartAxisType.X];
    const yAxis = config.axes[yAxisType];
    const yName = config.names?.[yAxisType];
    const color = config.colors?.[yAxisType];

    const valueAttribute = {...yAxis, key: DataObjectInfoKeyType.Y};
    const metaAttributes: DataObjectAttribute[] = color ? [valueAttribute, {
      ...color,
      key: DataObjectInfoKeyType.Color
    }] : [valueAttribute];

    const dataObjectsInfo = this.dataObjectAggregator.convert({
      groupingAttributes: yName ? [{...yName, key: DataObjectInfoKeyType.Name}] : [],
      objectAttributes: [{...xAxis, key: DataObjectInfoKeyType.X}],
      metaAttributes,
      objectsConverter: (value,) => value,
    });

    return this.convertAggregatedData(dataObjectsInfo, config, yAxisType);
  }

  private convertAggregatedData(
    dataObjectsInfo: DataObjectInfo<string>[],
    config: ChartConfig,
    yAxisType: ChartYAxisType
  ): ChartConvertData {
    const xAxis = config.axes[ChartAxisType.X];
    const yAxis = config.axes[yAxisType];
    const yAxisName = this.attributeNameForAxis(yAxis);
    const yConstraint = this.constraintForAxis(yAxis);
    const setId = this.yAxisSetId(config, yAxisType);
    const colorAxis = config.colors?.[yAxisType];
    const canDragAxis = this.canDragAxis(yAxis);
    const axisColor = this.dataObjectAggregator.getAttributeResourceColor(yAxis);
    const numSets = uniqueValues(dataObjectsInfo.map(dataObject => dataObject.groupingObjects?.[0] || '')).length;
    const colorAlphaStep = 70 / Math.max(1, numSets - 1); // min alpha is 30
    const xValues = new Set();
    const yValues = new Set();
    let isYNum = true
    let isXNum = true

    const setsMap: Record<string, ChartDataSet> = {};
    for (const dataObject of dataObjectsInfo) {
      const setName = dataObject.groupingObjects?.[0] || yAxisName;
      if (!setsMap[setName]) {
        setsMap[setName] = {
          id: setId,
          name: setName,
          resourceType: yAxis.resourceType,
          points: [],
          draggable: false,
          yAxisType,
        };
      }

      const set = setsMap[setName];

      const colorDataResources = dataObject.metaDataResources[DataObjectInfoKeyType.Color] || [];
      const pointColor = this.dataObjectAggregator.getAttributeColor(colorAxis, colorDataResources);

      const setIndex = Object.keys(setsMap).findIndex(key => key === setName);
      const color = hex2rgba(pointColor || axisColor, (100 - setIndex * colorAlphaStep) / 100);

      const xDataResource = dataObject.objectDataResources[DataObjectInfoKeyType.X];
      const xValue = this.formatChartAxisValue(xDataResource.data?.[xAxis.attributeId], xAxis);

      const valueObjects = (dataObject.metaDataResources[DataObjectInfoKeyType.Y] || [])
        .map(object => ({id: object.id, value: object.data[yAxis.attributeId]}))
        .filter(obj => obj.value !== '' && isNotNullOrUndefined(obj.value));

      const values = valueObjects.map(obj => obj.value);
      const aggregation = config.aggregations && config.aggregations[yAxisType];
      let yValue = aggregateDataValues(aggregation, values, yConstraint);
      const title = isValueAggregation(aggregation) ? this.formatPointTitleValue(yValue, yAxis) : isNotNullOrUndefined(yValue) ? String(yValue) : yValue;
      yValue = isValueAggregation(aggregation) ? this.formatChartAxisValue(yValue, yAxis) : yValue;
      if (isNotNullOrUndefined(yValue)) {
        const id =
          canDragAxis && valueObjects.length === 1 && isValueAggregation(aggregation) ? valueObjects[0].id : null;

        set.points.push({id, x: xValue, y: yValue, color, title});
        set.draggable = set.draggable || isNotNullOrUndefined(id);
        isXNum = isXNum && isNumeric(xValue);
        xValues.add(xValue);
        isYNum = isYNum && isNumeric(yValue);
        yValues.add(yValue);
      }
    }
    const sets = Object.values(setsMap);
    const xConstraint = this.constraintForAxis(xAxis);
    const xAxisHelperData: ChartAxisHelperData = {
      constraint: xConstraint,
      values: Array.from(xValues),
      valuesAreNumeric: isXNum
    };
    const yAxisHelperData: ChartAxisHelperData = {
      constraint: yConstraint,
      values: Array.from(yValues),
      valuesAreNumeric: isYNum
    };

    return {sets, xAxisHelperData, yAxisHelperData};
  }

  private formatPointTitleValue(value: any, axis: ChartAxis): any {
    const constraint = this.constraintForAxis(axis) || new UnknownConstraint();
    return constraint.createDataValue(value, this.constraintData).title();
  }

  private formatChartAxisValue(value: any, axis: ChartAxis): any {
    const constraint = this.constraintForAxis(axis);
    if (constraint.type === ConstraintType.Boolean && !value) {
      return false;
    }
    const formattedValue = this.formatChartValue(value, constraint || new UnknownConstraint(), this.constraintData);
    return isNumeric(formattedValue) ? toNumber(formattedValue) : formattedValue;
  }

  private formatChartValue(value: any, constraint: Constraint, constraintData: ConstraintData): any {
    if (isNullOrUndefined(value)) {
      return value;
    }

    switch (constraint?.type) {
      case ConstraintType.Text:
      case ConstraintType.Address:
      case ConstraintType.Unknown:
      case ConstraintType.Files:
        return constraint.createDataValue(value, this.constraintData).title();
      default:
        return (constraint || new UnknownConstraint())
          .createDataValue(value, constraintData || this.constraintData)
          .serialize();
    }
  }

  // private formatDateTimeValue(value: any, config: DateTimeConstraintConfig): string {
  //   const format = config?.format;
  //   const momentDate = parseMomentDate(value, format);
  //   return momentDate?.format(convertChartDateFormat(format));
  // }

  private canDragAxis(yAxis: ChartAxis): boolean {
    return this.dataObjectAggregator.isAttributeEditable(yAxis);
  }

  private attributeNameForAxis(axis: ChartAxis): string {
    return axis && this.attributeForAxis(axis)?.name;
  }

  private yAxisSetId(config: ChartConfig, yAxisType: ChartYAxisType): string {
    return config.axes?.[yAxisType]?.attributeId;
  }

  public convertAxisType(config: ChartConfig, type: ChartYAxisType): ChartData {
    const xAxis = config.axes[ChartAxisType.X];
    const yAxis = config.axes[type];

    const otherSets = type === ChartAxisType.Y1 ? this.y2Sets : this.y1Sets;
    const otherSetsAreEmpty = !otherSets || otherSets.length === 0;

    const {sets, xAxisHelperData, yAxisHelperData} = ((yAxis || (xAxis && otherSetsAreEmpty)) && this.convertAxis(config, type)) || {sets: []};
    if (type === ChartAxisType.Y1) {
      this.y1Sets = sets;
      this.xAxisHelperData1 = xAxisHelperData;
      this.y1AxisHelperData = yAxisHelperData
    } else {
      this.y2Sets = sets;
      this.xAxisHelperData2 = xAxisHelperData;
      this.y2AxisHelperData = yAxisHelperData
    }

    const otherYAxis = config.axes[type === ChartAxisType.Y1 ? ChartAxisType.Y2 : ChartAxisType.Y1];
    if (sets.length > 0 && !otherYAxis) {
      this.clearOtherSetsByType(type);
    }

    this.currentConfig = config;
    return this.convertType(config.type);
  }

  private clearOtherSetsByType(type: ChartAxisType) {
    if (type === ChartAxisType.Y1) {
      this.y2Sets = [];
      this.y2AxisHelperData = null;
      this.xAxisHelperData2 = null;
    } else {
      this.y1Sets = [];
      this.y2AxisHelperData = null;
      this.xAxisHelperData1 = null;
    }
  }

  private createEmptyData(config: ChartConfig): ChartData {
    const emptySet: ChartDataSet = {
      id: undefined,
      name: '',
      points: [],
      resourceType: AttributesResourceType.Collection,
      draggable: false,
      yAxisType: ChartAxisType.Y1,
    };

    this.y1Sets = [emptySet];
    this.y2Sets = [];
    this.currentConfig = config;
    return {sets: [emptySet], type: config.type};
  }
}
