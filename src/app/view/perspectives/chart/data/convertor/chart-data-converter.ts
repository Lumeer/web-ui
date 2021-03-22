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
import {AttributesResourceType} from '../../../../../core/model/resource';
import {
  ChartAxis,
  ChartAxisConfig,
  ChartAxisType,
  ChartConfig,
  ChartSortType,
  ChartType,
} from '../../../../../core/store/charts/chart';
import {Attribute, Collection} from '../../../../../core/store/collections/collection';
import {findAttribute} from '../../../../../core/store/collections/collection.util';
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
  objectValues,
  toNumber,
} from '../../../../../shared/utils/common.utils';
import {aggregateDataValues, isValueAggregation} from '../../../../../shared/utils/data/data-aggregation';
import {DataAggregatorAttribute} from '../../../../../shared/utils/data/data-aggregator';
import {hex2rgba, shadeColor} from '../../../../../shared/utils/html-modifier';
import {ChartAxisData, ChartAxisTick, ChartData, ChartDataSet, ChartPoint, ChartYAxisType} from './chart-data';
import {
  DataObjectAggregator,
  DataObjectAttribute,
  DataObjectInfo,
} from '../../../../../shared/utils/data/data-object-aggregator';
import {uniqueValues} from '../../../../../shared/utils/array.utils';
import {createRange} from '../../visualizer/plot-maker/plot-util';
import {
  Constraint,
  ConstraintData,
  ConstraintType,
  DateTimeConstraint,
  DurationConstraint,
  NumberConstraint,
  PercentageConstraint,
  UnknownConstraint,
} from '@lumeer/data-filters';

enum DataObjectInfoKeyType {
  X = 'x',
  Y = 'y',
  Name = 'name',
  Color = 'color',
  Size = 'size',
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
  preventScaleAxis?: boolean;
  ticks: ChartAxisTick[];
}

const MAX_TICKS = 5;

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

  private dataObjectAggregator = new DataObjectAggregator<string>((value, constraint, data, aggregatorAttribute) =>
    this.formatDataAggregatorValue(value, constraint, data, aggregatorAttribute)
  );

  constructor(private constraintItemsFormatter: SelectItemWithConstraintFormatter) {}

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
      documents,
      linkTypes,
      linkInstances,
      query.stems?.[0],
      permissions,
      constraintData
    );
  }

  private sortDataSets(config: ChartConfig, sets: ChartDataSet[], constraintData: ConstraintData): ChartDataSet[] {
    return sets.map(set => ({...set, points: this.sortPoints(config, set.points, constraintData)}));
  }

  private sortPoints(config: ChartConfig, points: ChartPoint[], constraintData: ConstraintData): ChartPoint[] {
    const sort = config.sort;
    const asc = !sort || sort.type === ChartSortType.Ascending;

    const sortAxis = sort?.axis || config.axes?.x?.axis;
    if (!sortAxis) {
      return points;
    }

    const constraint = this.dataObjectAggregator.findAttributeConstraint(sortAxis);

    return (points || []).sort((a, b) => {
      const multiplier = asc ? 1 : -1;
      const aValue = constraint.createDataValue(a.xSort || a.x, constraintData);
      const bValue = constraint.createDataValue(b.xSort || b.x, constraintData);
      return aValue.compareTo(bValue) * multiplier;
    });
  }

  public convertType(type: ChartType): ChartData {
    if (this.areSetsEmpty()) {
      return this.createEmptyData({...this.currentConfig, type});
    }

    this.currentConfig = {...this.currentConfig, type};

    const xAxisData = this.createAxisData(this.xAxisHelperData1, this.xAxisHelperData2);
    const ranges = this.currentConfig.lockAxes
      ? this.createAxesRanges(this.y1AxisHelperData, this.y2AxisHelperData)
      : null;
    const y1AxisData: ChartAxisData = this.y1AxisHelperData && {
      ...this.createAxisData(this.y1AxisHelperData),
      range: ranges?.y1,
    };
    const y2AxisData: ChartAxisData = this.y2AxisHelperData && {
      ...this.createAxisData(this.y2AxisHelperData),
      range: ranges?.y2,
    };

    return {
      type,
      sets: this.sortDataSets(
        this.currentConfig,
        [...(this.y1Sets || []), ...(this.y2Sets || [])],
        this.constraintData
      ),
      xAxisData,
      y1AxisData,
      y2AxisData,
    };
  }

  private areSetsEmpty(): boolean {
    return (!this.y1Sets || this.y1Sets.length === 0) && (!this.y2Sets || this.y2Sets.length === 0);
  }

  public convert(config: ChartConfig): ChartData {
    const xAxis = config.axes?.x?.axis;
    const y1Axis = config.axes?.y1?.axis;
    const y2Axis = config.axes?.y2?.axis;

    if (!xAxis && !y1Axis && !y2Axis) {
      return this.createEmptyData(config);
    }

    if (y1Axis && y2Axis) {
      const {sets: y1Sets, xAxisHelperData: xAxisHelperData1, yAxisHelperData: y1AxisHelperData} = this.convertAxis(
        config,
        ChartAxisType.Y1
      );
      const {sets: y2Sets, xAxisHelperData: xAxisHelperData2, yAxisHelperData: y2AxisHelperData} = this.convertAxis(
        config,
        ChartAxisType.Y2
      );
      this.xAxisHelperData1 = xAxisHelperData1;
      this.xAxisHelperData2 = xAxisHelperData2;
      this.y1AxisHelperData = y1AxisHelperData;
      this.y2AxisHelperData = y2AxisHelperData;
      this.y1Sets = y1Sets;
      this.y2Sets = y2Sets;
      this.currentConfig = config;
      return this.convertType(config.type);
    } else if (!y2Axis && (xAxis || y1Axis)) {
      const {sets: y1Sets, xAxisHelperData, yAxisHelperData: y1AxisHelperData} = this.convertAxis(
        config,
        ChartAxisType.Y1
      );
      this.xAxisHelperData1 = xAxisHelperData;
      this.y1Sets = y1Sets;
      this.y1AxisHelperData = y1AxisHelperData;
      this.currentConfig = config;
      this.clearOtherSetsByType(ChartAxisType.Y1);
      return this.convertType(config.type);
    } else if (xAxis || y2Axis) {
      const {sets: y2Sets, xAxisHelperData, yAxisHelperData: y2AxisHelperData} = this.convertAxis(
        config,
        ChartAxisType.Y2
      );
      this.xAxisHelperData2 = xAxisHelperData;
      this.y2Sets = y2Sets;
      this.y2AxisHelperData = y2AxisHelperData;
      this.currentConfig = config;
      this.clearOtherSetsByType(ChartAxisType.Y2);
      return this.convertType(config.type);
    }

    return this.createEmptyData(config);
  }

  private createAxesRanges(
    y1HelperData: ChartAxisHelperData,
    y2HelperData: ChartAxisHelperData
  ): {y1: [number, number]; y2: [number, number]} {
    if (!y1HelperData?.valuesAreNumeric || !y2HelperData?.valuesAreNumeric) {
      return null;
    }
    const type1 = this.getAxisConstraintType(y1HelperData.valuesAreNumeric, y1HelperData.constraint);
    const type2 = this.getAxisConstraintType(y2HelperData.valuesAreNumeric, y2HelperData.constraint);

    if (this.shouldCreateRange(type1, type2)) {
      const {y1Scale, y2Scale} = this.getRangeScales(type1, type2);
      const values1 = (y1HelperData.values || []).map(val => val * y1Scale);
      const values2 = (y2HelperData.values || []).map(val => val * y2Scale);

      const values = [...values1, ...values2];
      const range = createRange(values);
      return {
        y1: range?.map(val => val / y1Scale) as [number, number],
        y2: range?.map(val => val / y2Scale) as [number, number],
      };
    }
    return null;
  }

  private shouldCreateRange(type1: ConstraintType, type2: ConstraintType): boolean {
    if (type1 === type2) {
      return true;
    }
    return (
      [type1, type2].includes(ConstraintType.Number) &&
      ([type1, type2].includes(ConstraintType.Percentage) || [type1, type2].includes(ConstraintType.Duration))
    );
  }

  private getRangeScales(type1: ConstraintType, type2: ConstraintType): {y1Scale: number; y2Scale: number} {
    if (type1 === type2) {
      return {y1Scale: 1, y2Scale: 1};
    }

    if (type1 === ConstraintType.Number) {
      if (type2 === ConstraintType.Duration) {
        return {y1Scale: 1, y2Scale: 0.001};
      } else if (type2 === ConstraintType.Percentage) {
        return {y1Scale: 1, y2Scale: 100};
      }
    }
    if (type2 === ConstraintType.Number) {
      if (type1 === ConstraintType.Duration) {
        return {y1Scale: 0.001, y2Scale: 1};
      } else if (type1 === ConstraintType.Percentage) {
        return {y1Scale: 100, y2Scale: 1};
      }
    }
    return {y1Scale: 1, y2Scale: 1};
  }

  private createAxisData(helperData: ChartAxisHelperData, helperData2?: ChartAxisHelperData): ChartAxisData {
    if (!helperData && !helperData2) {
      return {constraintType: ConstraintType.Unknown, constraint: new UnknownConstraint()};
    }

    const constraint = helperData?.constraint || helperData2?.constraint;
    const isNum = (!helperData || helperData.valuesAreNumeric) && (!helperData2 || helperData2.valuesAreNumeric);
    const constraintType = this.getAxisConstraintType(isNum, constraint);
    const preventScaleAxis = helperData?.preventScaleAxis || helperData2?.preventScaleAxis;
    const decimals = preventScaleAxis ? 0 : 8;

    let formatter: (value: any) => string;
    if (constraintType === ConstraintType.Percentage) {
      const percentageConstraint = <PercentageConstraint>constraint;
      formatter = x => percentageConstraint.createDataValue(x).title({decimals});
    } else if (constraintType === ConstraintType.Number) {
      const numberConstraint = <NumberConstraint>constraint;
      formatter = x => numberConstraint.createDataValue(x).title({decimals});
    } else if (constraintType === ConstraintType.Duration) {
      const durationConstraint = <DurationConstraint>constraint;
      formatter = x =>
        durationConstraint.createDataValue(x, this.constraintData).title({maxUnits: 2, decimalPlaces: decimals});
    } else if (constraintType === ConstraintType.DateTime) {
      const dateConstraint = <DateTimeConstraint>constraint;
      formatter = date => dateConstraint.createDataValue(date).title();
    }

    const allValues = uniqueValues([...(helperData?.values || []), ...(helperData2?.values || [])]);
    let ticks: ChartAxisTick[] = null;
    if (this.shouldCreateTicks(constraintType, allValues, preventScaleAxis)) {
      const ticksMap = (helperData?.ticks || []).reduce((map, tick) => ({...map, [tick.value]: tick}), {});
      helperData2?.ticks.forEach(tick => {
        if (!ticksMap[tick.value]) {
          ticksMap[tick.value] = tick;
        }
      });
      ticks = objectValues(ticksMap);
    }

    let showTicksAsLinear = false;
    if ((constraintType === ConstraintType.DateTime || preventScaleAxis) && allValues.length <= MAX_TICKS) {
      showTicksAsLinear = true;
    }

    return {constraintType, constraint, formatter, ticks, showTicksAsLinear};
  }

  private shouldCreateTicks(constraintType: ConstraintType, values: any[], preventScaleAxis: boolean): boolean {
    if ((constraintType === ConstraintType.DateTime || preventScaleAxis) && values.length <= MAX_TICKS) {
      return true;
    }
    return ![
      ConstraintType.DateTime,
      ConstraintType.Number,
      ConstraintType.Duration,
      ConstraintType.Percentage,
    ].includes(constraintType);
  }

  private convertAxis(config: ChartConfig, yAxisType: ChartYAxisType): ChartConvertData {
    const xAxis = config.axes?.x?.axis;
    const yAxis = config.axes?.[yAxisType]?.axis;

    if (!xAxis || !yAxis) {
      return this.convertAxisSimple(yAxisType, xAxis, yAxis, config.sort?.axis);
    }

    return this.convertAxisWithAggregation(config, yAxisType);
  }

  private convertAxisSimple(
    yAxisType: ChartYAxisType,
    xAxis: ChartAxis,
    yAxis: ChartAxis,
    sortAxis: ChartAxis
  ): ChartConvertData {
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
    const pointColor = this.dataObjectAggregator.getAttributeResourceColor(definedAxis);

    const ticks: ChartAxisTick[] = [];

    for (const dataObject of dataResources) {
      const value = dataObject.data?.[(xAxis || yAxis)?.attributeId];
      const xSort = sortAxis && dataObject.data?.[sortAxis.attributeId];
      const values = isArray(value) ? value : [value];
      for (let i = 0; i < values.length; i++) {
        const formattedValue = this.formatChartAxisValue(values[i], definedAxis);
        if (isNullOrUndefined(formattedValue) || actualValues.has(formattedValue)) {
          continue;
        }

        const id = draggable ? dataObject?.id : null;
        const title = this.formatPointTitleValue(values[i], definedAxis);
        isNum = isNum && isNumeric(formattedValue);

        const point = {
          id,
          x: xAxis ? formattedValue : null,
          y: yAxis ? formattedValue : null,
          xSort,
          color: pointColor,
          title: yAxis ? title : null,
          xTitle: xAxis ? title : null,
          size: null,
        };
        points.push(point);
        actualValues.add(formattedValue);
        ticks.push({value: formattedValue, title});
      }
    }

    const name = this.attributeNameForAxis(yAxis);
    const axisHelperData: ChartAxisHelperData = {
      constraint,
      valuesAreNumeric: isNum,
      values: Array.from(actualValues),
      ticks,
    };

    const dataSet: ChartDataSet = {
      id: yAxis?.attributeId,
      points,
      yAxisType,
      name,
      draggable,
      resourceType: definedAxis.resourceType,
      color: pointColor,
    };
    return {
      sets: [dataSet],
      xAxisHelperData: xAxis ? axisHelperData : null,
      yAxisHelperData: yAxis ? axisHelperData : null,
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

  private constraintAxisConfig(axisConfig: ChartAxisConfig): Constraint {
    if (!isValueAggregation(axisConfig.aggregation)) {
      return new NumberConstraint({});
    }

    return this.constraintForAxis(axisConfig.axis);
  }

  private constraintForAxis(axis: ChartAxis): Constraint {
    const attribute = axis && this.attributeForAxis(axis);
    return this.constraintForAttribute(attribute, axis?.constraint);
  }

  private constraintForAttribute(attribute: Attribute, overrideConstraint: Constraint): Constraint {
    const constraint = attribute?.constraint;
    const chartConstraint =
      overrideConstraint && this.constraintItemsFormatter.checkValidConstraintOverride(constraint, overrideConstraint);

    return chartConstraint || constraint || new UnknownConstraint();
  }

  private convertAxisWithAggregation(config: ChartConfig, yAxisType: ChartYAxisType): ChartConvertData {
    const xAxis = config.axes?.x?.axis;
    const yAxisConfig = config.axes?.[yAxisType];
    const yAxis = yAxisConfig?.axis;
    const yName = yAxisConfig?.name;

    const colorAttribute: DataObjectAttribute = yAxisConfig?.color
      ? {
          ...yAxisConfig.color,
          key: DataObjectInfoKeyType.Color,
        }
      : null;
    const sizeAttribute: DataObjectAttribute = yAxisConfig?.size
      ? {
          ...yAxisConfig.size,
          key: DataObjectInfoKeyType.Size,
        }
      : null;

    const valueAttribute = {...yAxis, key: DataObjectInfoKeyType.Y};
    const metaAttributes: DataObjectAttribute[] = [valueAttribute, colorAttribute, sizeAttribute].filter(
      attribute => !!attribute
    );

    const objectAttributes = [{...xAxis, key: DataObjectInfoKeyType.X}];
    if (config.type === ChartType.Bubble) {
      objectAttributes.push(valueAttribute);
    }

    const dataObjectsInfo = this.dataObjectAggregator.convert(
      {
        groupingAttributes: yName ? [{...yName, key: DataObjectInfoKeyType.Name}] : [],
        objectAttributes,
        metaAttributes,
        objectsConverter: value => value,
      },
      true
    );

    return this.convertAggregatedData(dataObjectsInfo, config, yAxisType);
  }

  private convertAggregatedData(
    dataObjectsInfo: DataObjectInfo<string>[],
    config: ChartConfig,
    yAxisType: ChartYAxisType
  ): ChartConvertData {
    const xAxisConfig = config.axes?.x;
    const xAxis = xAxisConfig?.axis;
    const yAxisConfig = config.axes?.[yAxisType];
    const yAxis = yAxisConfig?.axis;
    const sortAxis = config.sort?.axis;
    const yConstraint = this.constraintAxisConfig(yAxisConfig);
    const xConstraint = this.constraintAxisConfig(xAxisConfig);
    const sizeConstraint = this.constraintForAxis(yAxisConfig?.size);
    const setId = this.yAxisSetId(config, yAxisType);
    const isDataSetDefined = !!yAxisConfig?.name;
    const colorAxis = yAxisConfig?.color;
    const canDragAxis = this.canDragAxis(yAxis);
    const resourceColor = this.dataObjectAggregator.getAttributeResourceColor(yAxis);
    const numSets = uniqueValues(dataObjectsInfo.map(dataObject => dataObject.groupingObjects?.[0] || '')).length;
    const colorAlphaStep = 70 / Math.max(1, numSets - 1); // min alpha is 30
    const xValues = new Set();
    const xTicks: ChartAxisTick[] = [];
    const yValues = new Set();
    const yTicks: ChartAxisTick[] = [];
    let isYNum = true;
    let isXNum = true;

    const setsMap: Record<string, ChartDataSet> = {};
    for (const dataObject of dataObjectsInfo) {
      const colorDataResources = dataObject.metaDataResources[DataObjectInfoKeyType.Color] || [];
      const attributeColor = this.dataObjectAggregator.getAttributeColor(colorAxis, colorDataResources);

      const setName = dataObject.groupingObjects?.[0] || ' ';
      let setIndex: number;
      let axisColor: string;
      if (setsMap[setName]) {
        setIndex = Object.keys(setsMap).findIndex(key => key === setName);
        axisColor = setsMap[setName].color;
      } else {
        setIndex = Object.keys(setsMap).length;
        axisColor = isDataSetDefined
          ? hex2rgba(attributeColor || resourceColor, (100 - setIndex * colorAlphaStep) / 100)
          : shadeColor(resourceColor, 0.5);
        setsMap[setName] = {
          id: setId,
          name: setName,
          resourceType: yAxis.resourceType,
          points: [],
          draggable: false,
          yAxisType,
          color: axisColor,
        };
      }

      let pointColor: string;
      if (isDataSetDefined) {
        pointColor = axisColor;
      } else {
        pointColor = hex2rgba(attributeColor || resourceColor, (100 - setIndex * colorAlphaStep) / 100);
      }

      const set = setsMap[setName];

      const xDataResource = dataObject.objectDataResources[DataObjectInfoKeyType.X];
      const xValue = this.formatChartAxisValue(xDataResource.data?.[xAxis.attributeId], xAxis);
      const xSort = sortAxis && xDataResource?.data?.[sortAxis.attributeId];
      const xTitle = this.formatPointTitleValue(xDataResource.data?.[xAxis.attributeId], xAxis);

      const valueObjects = (dataObject.metaDataResources[DataObjectInfoKeyType.Y] || [])
        .map(object => ({id: object.id, value: object.data[yAxis.attributeId]}))
        .filter(
          obj => yConstraint?.type === ConstraintType.Boolean || (obj.value !== '' && isNotNullOrUndefined(obj.value))
        );

      const values = valueObjects.map(obj => obj.value);
      const aggregation = yAxisConfig?.aggregation;
      let yValue = aggregateDataValues(aggregation, values, yConstraint);
      const title = isValueAggregation(aggregation)
        ? this.formatPointTitleValue(yValue, yAxis)
        : isNotNullOrUndefined(yValue)
        ? String(yValue)
        : yValue;
      yValue = isValueAggregation(aggregation) ? this.formatChartAxisValue(yValue, yAxis) : yValue;
      if (isNotNullOrUndefined(xValue) && isNotNullOrUndefined(yValue)) {
        const sizeDataResources = dataObject.metaDataResources[DataObjectInfoKeyType.Size] || [];
        const sizes = sizeDataResources.map(dataResource => dataResource?.data[yAxisConfig?.size?.attributeId]);
        const size = yAxisConfig?.size ? aggregateDataValues(aggregation, sizes, sizeConstraint, true) : null;

        const id =
          canDragAxis && valueObjects.length === 1 && isValueAggregation(aggregation) ? valueObjects[0].id : null;

        const sizeTitle = yAxisConfig?.size ? this.formatPointTitleValue(size, yAxisConfig?.size) : null;
        set.points.push({
          id,
          x: xValue,
          xSort,
          y: yValue,
          color: pointColor,
          title: sizeTitle || title,
          xTitle,
          size,
        });
        set.draggable = set.draggable || isNotNullOrUndefined(id);

        isXNum = isXNum && isNumeric(xValue);
        xValues.add(xValue);
        xTicks.push({value: xValue, title: xTitle});

        isYNum = isYNum && isNumeric(yValue);
        yValues.add(yValue);
        yTicks.push({value: yValue, title});
      }
    }

    const sets = objectValues(setsMap);
    const xAxisHelperData: ChartAxisHelperData = {
      constraint: xConstraint,
      values: Array.from(xValues),
      valuesAreNumeric: isXNum,
      ticks: xTicks,
    };
    const yAxisHelperData: ChartAxisHelperData = {
      constraint: yConstraint,
      values: Array.from(yValues),
      valuesAreNumeric: isYNum,
      preventScaleAxis: !isValueAggregation(yAxisConfig.aggregation),
      ticks: yTicks,
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
      case ConstraintType.DateTime:
        return this.formatDateTimeValue(value, constraint as DateTimeConstraint);
      default:
        return (constraint || new UnknownConstraint())
          .createDataValue(value, constraintData || this.constraintData)
          .serialize();
    }
  }

  private formatDateTimeValue(value: any, constraint: DateTimeConstraint): string {
    const dataValue = constraint.createDataValue(value);
    return dataValue.momentDate?.format('YYYY-MM-DD HH:mm:SS.ss');
  }

  private canDragAxis(yAxis: ChartAxis): boolean {
    return this.dataObjectAggregator.isAttributeEditable(yAxis);
  }

  private attributeNameForAxis(axis: ChartAxis): string {
    return axis && this.attributeForAxis(axis)?.name;
  }

  private yAxisSetId(config: ChartConfig, yAxisType: ChartYAxisType): string {
    return config.axes?.[yAxisType]?.axis?.attributeId;
  }

  public convertAxisType(config: ChartConfig, type: ChartYAxisType): ChartData {
    const xAxis = config.axes?.x?.axis;
    const yAxisConfig = config.axes?.[type];
    const yAxis = yAxisConfig?.axis;

    const otherSets = type === ChartAxisType.Y1 ? this.y2Sets : this.y1Sets;
    const otherSetsAreEmpty = !otherSets || otherSets.length === 0;

    const {sets, xAxisHelperData, yAxisHelperData} = ((yAxis || (xAxis && otherSetsAreEmpty)) &&
      this.convertAxis(config, type)) || {sets: []};
    if (type === ChartAxisType.Y1) {
      this.y1Sets = sets;
      this.xAxisHelperData1 = xAxisHelperData;
      this.y1AxisHelperData = yAxisHelperData;
    } else {
      this.y2Sets = sets;
      this.xAxisHelperData2 = xAxisHelperData;
      this.y2AxisHelperData = yAxisHelperData;
    }

    const otherYAxis = config.axes?.[type === ChartAxisType.Y1 ? ChartAxisType.Y2 : ChartAxisType.Y1]?.axis;
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
