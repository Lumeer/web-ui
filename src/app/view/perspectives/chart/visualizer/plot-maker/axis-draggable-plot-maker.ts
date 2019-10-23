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

import * as d3 from 'd3';
import * as moment from 'moment';
import {Layout} from 'plotly.js';
import {DateTimeConstraint} from '../../../../../core/model/constraint/datetime.constraint';
import {
  ConstraintConfig,
  DateTimeConstraintConfig,
  DurationConstraintConfig,
} from '../../../../../core/model/data/constraint-config';
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {createDateTimeOptions} from '../../../../../shared/date-time/date-time-options';
import {uniqueValues} from '../../../../../shared/utils/array.utils';
import {isNotNullOrUndefined, isNumeric, toNumber} from '../../../../../shared/utils/common.utils';
import {
  formatDurationDataValue,
  getDurationSaveValue,
} from '../../../../../shared/utils/constraint/duration-constraint.utils';
import {
  ChartAxisCategory,
  ChartDataSetAxis,
  ChartPoint,
  ChartYAxisType,
  checkKnownOverrideFormatEntry,
  convertChartDateFormat,
} from '../../data/convertor/chart-data';
import {convertChartDateTickFormat} from '../chart-util';
import {DraggablePlotMaker} from './draggable-plot-maker';
import {createRange} from './plot-util';

export abstract class AxisDraggablePlotMaker extends DraggablePlotMaker {
  public abstract getPoints(): any;

  public abstract getTraceIndexForPoint(point: any): number;

  public abstract getSetIndexForTraceIndex(traceIx: number): number;

  public abstract getPointPosition(point: any, datum: any): {x: number; y: number};

  public abstract getPointNewY(point: any, datum: any, event: any): number;

  protected xAxisLayout(): Partial<Layout> {
    const category = this.axisCategory(ChartAxisType.X);
    const config = this.axisConfig(ChartAxisType.X);
    if (category === ChartAxisCategory.Date) {
      const dateConfig = config as DateTimeConstraintConfig;
      const {values, titles} = this.createXDateTicks(dateConfig);
      if (this.shouldShowDateAsArrayTicks(values.length, dateConfig.format)) {
        return {
          xaxis: {
            tickmode: 'array',
            tickvals: values,
            ticktext: titles,
          },
        };
      }

      const tickFormat = convertChartDateTickFormat(dateConfig && dateConfig.format);
      return {
        xaxis: {
          type: 'date',
          tickformat: tickFormat,
          hoverformat: tickFormat,
        },
      };
    } else if (category === ChartAxisCategory.Percentage) {
      return {
        xaxis: {
          ticksuffix: '%',
        },
      };
    } else if (category === ChartAxisCategory.Duration) {
      const {values, titles} = this.createXDurationTicks(config as DurationConstraintConfig);
      return {
        xaxis: {
          tickmode: 'array',
          tickvals: values,
          ticktext: titles,
        },
      };
    }
    return {};
  }

  private shouldShowDateAsArrayTicks(numValues: number, format: string): boolean {
    if (numValues < 1) {
      return false;
    }

    const knowFormatEntry = checkKnownOverrideFormatEntry(format);
    const options = createDateTimeOptions(format);
    if (knowFormatEntry || !options.year) {
      // plotly needs year in format in order to show correctly as interval
      return true;
    }

    return false;
  }

  private createXDateTicks(config: DateTimeConstraintConfig): {values: number[]; titles: string[]} {
    return this.createDateTicks(config, 'x');
  }

  private createYDateTicks(config: DateTimeConstraintConfig, yAxisType: ChartYAxisType) {
    return this.createDateTicks(config, 'y', yAxisType);
  }

  private createDateTicks(
    config: DateTimeConstraintConfig,
    param: string,
    yAxisType?: ChartYAxisType
  ): {values: number[]; titles: string[]} {
    const chartFormat = convertChartDateFormat(config.format);
    const values = this.chartData.sets
      .reduce((allValues, set) => {
        if (yAxisType && set.yAxisType !== yAxisType) {
          return allValues;
        }

        const setValues = set.points
          .map(point => this.createDateValue(point[param], chartFormat))
          .filter(value => isNotNullOrUndefined(value));
        allValues.push(...setValues);
        return uniqueValues<number>(allValues);
      }, [])
      .sort();

    const constraint = new DateTimeConstraint(config);
    const titles = values.map(value => constraint.createDataValue(value).format());
    return {values, titles};
  }

  protected createDateValue(value: any, format: string): number {
    const momentDate = isNotNullOrUndefined(value) ? moment(value, format) : null;
    return momentDate && momentDate.isValid() ? momentDate.toDate().getTime() : null;
  }

  private createXDurationTicks(config: DurationConstraintConfig): {values: number[]; titles: string[]} {
    const values = this.chartData.sets
      .reduce((allValues, set) => {
        const setValues = set.points
          .filter(point => isNotNullOrUndefined(point.x) && isNumeric(point.x))
          .map(point => point.x);
        allValues.push(...setValues);
        return uniqueValues<number>(allValues);
      }, [])
      .sort();

    const durationUnitsMap = this.chartData.constraintData && this.chartData.constraintData.durationUnitsMap;
    const titles = values.map(value => formatDurationDataValue(value, config, durationUnitsMap));
    return {values, titles};
  }

  protected yAxis1Layout(): Partial<Layout> {
    const category = this.axisCategory(ChartAxisType.Y1);
    const config = this.axisConfig(ChartAxisType.Y1);
    if (category === ChartAxisCategory.Number) {
      return {
        yaxis: {
          range: this.createRange(),
        },
      };
    } else if (category === ChartAxisCategory.Duration) {
      const durationConfig = config as DurationConstraintConfig;
      const range = this.createRange(true);
      const {values, titles} = this.createYDurationTicks(range, durationConfig);
      return {
        yaxis: {
          range: this.areBothYAxisPresented() ? range : null,
          tickmode: 'array',
          tickvals: values,
          ticktext: titles,
        },
      };
    } else if (category === ChartAxisCategory.Date) {
      const dateConfig = config as DateTimeConstraintConfig;
      const {values, titles} = this.createYDateTicks(dateConfig, ChartAxisType.Y1);
      if (this.shouldShowDateAsArrayTicks(values.length, dateConfig.format)) {
        return {
          yaxis: {
            range: [values[0], values[values.length - 1]],
            tickmode: 'array',
            tickvals: values,
            ticktext: titles,
          },
        };
      }

      const tickFormat = convertChartDateTickFormat(dateConfig && dateConfig.format);
      return {
        yaxis: {
          type: 'date',
          tickformat: tickFormat,
          hoverformat: tickFormat,
        },
      };
    } else if (category === ChartAxisCategory.Percentage) {
      return {
        yaxis: {
          ticksuffix: '%',
        },
      };
    }

    return {
      yaxis: {
        type: 'category',
        categoryarray: this.getYAxisCategories(ChartAxisType.Y1),
      },
    };
  }

  private createYDurationTicks(
    range: number[],
    config: DurationConstraintConfig
  ): {values: number[]; titles: string[]} {
    const durationUnitsMap = this.chartData.constraintData && this.chartData.constraintData.durationUnitsMap;
    const optimalTickApproxValue = Math.floor((range[1] - range[0]) / 6);
    const optimalTickApproxValueString = formatDurationDataValue(optimalTickApproxValue, config, durationUnitsMap, 1);
    const optimalTick = getDurationSaveValue(optimalTickApproxValueString, config, durationUnitsMap);
    const numTicks = Math.floor((range[1] * 2) / optimalTick);
    const values = [0];
    const titles = ['0'];
    for (let i = 1; i < numTicks; i++) {
      const value = i * optimalTick;
      values.push(value);
      titles.push(formatDurationDataValue(value, config, durationUnitsMap));
    }
    return {values, titles};
  }

  private createRange(force?: boolean): any[] {
    if (
      !force &&
      (!this.areBothYAxisPresented() ||
        !this.isNumericCategory(this.axisCategory(ChartAxisType.Y1)) ||
        !this.isNumericCategory(this.axisCategory(ChartAxisType.Y2)))
    ) {
      return null;
    }

    const values = this.chartData.sets.reduce((allValues, set) => {
      const setValues = set.points
        .filter(point => isNotNullOrUndefined(point.y) && isNumeric(point.y))
        .map(point => point.y);
      allValues.push(...setValues);
      return allValues;
    }, []);

    return createRange(values);
  }

  protected yAxis2Layout(): Partial<Layout> {
    if (!this.isY2AxisPresented()) {
      return {};
    }

    const category = this.axisCategory(ChartAxisType.Y2);
    const config = this.axisConfig(ChartAxisType.Y2);
    if (category === ChartAxisCategory.Number) {
      return {
        yaxis2: {
          overlaying: 'y',
          side: 'right',
          range: this.createRange(),
        },
      };
    } else if (category === ChartAxisCategory.Duration) {
      const durationConfig = config as DurationConstraintConfig;
      const range = this.createRange(true);
      const {values, titles} = this.createYDurationTicks(range, durationConfig);
      return {
        yaxis2: {
          overlaying: 'y',
          side: 'right',
          range: this.areBothYAxisPresented() ? range : null,
          tickmode: 'array',
          tickvals: values,
          ticktext: titles,
        },
      };
    } else if (category === ChartAxisCategory.Date) {
      const dateConfig = config as DateTimeConstraintConfig;
      const {values, titles} = this.createYDateTicks(dateConfig, ChartAxisType.Y2);
      if (this.shouldShowDateAsArrayTicks(values.length, dateConfig.format)) {
        return {
          yaxis2: {
            overlaying: 'y',
            side: 'right',
            range: [values[0], values[values.length - 1]],
            tickmode: 'array',
            tickvals: values,
            ticktext: titles,
          },
        };
      }

      const tickFormat = convertChartDateTickFormat(dateConfig && dateConfig.format);
      return {
        yaxis2: {
          overlaying: 'y',
          side: 'right',
          type: 'date',
          tickformat: tickFormat,
          hoverformat: tickFormat,
        },
      };
    } else if (category === ChartAxisCategory.Percentage) {
      return {
        yaxis2: {
          overlaying: 'y',
          side: 'right',
          ticksuffix: '%',
        },
      };
    }

    return {
      yaxis2: {
        overlaying: 'y',
        side: 'right',
        type: 'category',
        categoryarray: this.getYAxisCategories(ChartAxisType.Y2),
      },
    };
  }

  protected formatXTrace(trace: any[], axis: ChartDataSetAxis): any[] {
    if (!axis) {
      return trace;
    }

    if (axis.category === ChartAxisCategory.Date) {
      const layout = this.xAxisLayout();
      if (layout && layout.xaxis && layout.xaxis.tickmode === 'array') {
        const config = axis.config as DateTimeConstraintConfig;
        const chartFormat = convertChartDateFormat(config.format);
        return trace.map(value => this.createDateValue(value, chartFormat));
      }
    }

    return trace;
  }

  protected getYTraceTexts(trace: any[], axis: ChartDataSetAxis): any[] {
    if (!axis || !axis.config) {
      return trace;
    }

    if (axis.category === ChartAxisCategory.Duration) {
      const config = axis.config as DurationConstraintConfig;
      const durationUnitsMap =
        this.chartData && this.chartData.constraintData && this.chartData.constraintData.durationUnitsMap;
      return trace.map(value =>
        isNotNullOrUndefined(value) ? formatDurationDataValue(value, config, durationUnitsMap) : value
      );
    }

    return trace;
  }

  protected getYAxisCategories(type: ChartYAxisType): string[] {
    const sets = this.getAxisDataSets(type);
    if (sets.length !== 1) {
      return [];
    }

    return sets[0].points.reduce((values, point) => {
      const value = point.y;
      if (value && !values.includes(value)) {
        values.push(value);
      }
      return values;
    }, []);
  }

  protected createYScale(setIx: number): d3.scale.Linear<number, number> | YScaleCategories {
    const yAxisElement = this.getYAxisElementForTrace(setIx);
    if (yAxisElement.type === 'category') {
      return this.createYScaleCategories(yAxisElement);
    } else if (yAxisElement.type === 'date') {
      return this.createYScaleTime(yAxisElement);
    }
    return this.createYScaleLinear(yAxisElement);
  }

  protected createYScaleLinear(yAxisElement: any): d3.scale.Linear<number, number> {
    return d3.scale
      .linear()
      .domain([this.getGridHeight(), 0])
      .range(yAxisElement.range);
  }

  protected createYScaleTime(yAxisElement: any): d3.scale.Linear<number, number> {
    const date1 = moment(yAxisElement.range[0])
      .toDate()
      .getTime();
    const date2 = moment(yAxisElement.range[1])
      .toDate()
      .getTime();

    return d3.scale
      .linear()
      .domain([this.getGridHeight(), 0])
      .rangeRound([date1, date2]);
  }

  protected createYScaleCategories(yAxisElement: any): YScaleCategories {
    const yAxisMargin = this.computeYMarginCategories(yAxisElement);
    const gridHeight = this.getGridHeight();
    const categories = yAxisElement._categories;
    const domainStep = (gridHeight - 2 * yAxisMargin) / (categories.length - 1);
    const domainRange = d3.range(yAxisMargin + domainStep / 2, gridHeight - yAxisMargin, domainStep);
    const domain = domainRange.reverse();

    const scale = value => {
      for (let i = 0; i < domain.length; i++) {
        if (value > domain[i]) {
          return categories[i];
        }
      }
      return categories.length > 0 ? categories[categories.length - 1] : null;
    };

    scale.invert = category => {
      const index = categories.findIndex(cat => cat === category);
      return domain[index];
    };

    return scale;
  }

  protected computeYMarginCategories(yAxisElement: any): number {
    const downRange = Math.abs(yAxisElement.range[0]);
    const upRange = Math.abs(yAxisElement.range[1]);
    const range = downRange + upRange;
    return (this.getGridHeight() / range) * downRange;
  }

  protected getGridHeight(): number {
    const element = this.getLayoutElement();
    return element.height - element.margin.t - element.margin.b;
  }

  protected getYAxisElementForTrace(setIx: number): any {
    const set = this.chartData.sets[setIx];
    if (set.yAxisType === ChartAxisType.Y1) {
      return this.getLayoutElement().yaxis;
    }
    return this.getLayoutElement().yaxis2;
  }

  protected isY1AxisPresented(): boolean {
    return this.getAxisDataSets(ChartAxisType.Y1).length > 0;
  }

  protected isY2AxisPresented(): boolean {
    return this.getAxisDataSets(ChartAxisType.Y2).length > 0;
  }

  protected areBothYAxisPresented(): boolean {
    return this.isY1AxisPresented() && this.isY2AxisPresented();
  }

  protected getLayoutElement(): any {
    return this.element.nativeElement._fullLayout;
  }

  protected canDragPoints(): boolean {
    return this.chartData && !!this.chartData.sets.find(set => set.draggable);
  }

  public initDoubleClick() {
    this.getPoints().on('dblclick', (event, index) => {
      const dataSetIndex = this.getDataSetByGlobalIndex(index);
      const dataSet = this.chartData.sets[dataSetIndex];
      const point = dataSet.points[event.i];
      this.onDoubleClick({setId: dataSet.id, pointId: point.id, resourceType: dataSet.resourceType});
    });
  }

  private getDataSetByGlobalIndex(index: number): number {
    let upperIndex = 0;
    for (let i = 0; i < this.chartData.sets.length; i++) {
      const pointsLength = (this.chartData.sets[i].points || []).length;
      upperIndex += pointsLength;
      if (index < upperIndex) {
        return i;
      }
    }

    return 0;
  }

  public initDrag() {
    this.destroyDrag();

    if (this.canDragPoints()) {
      this.getPoints().call(this.createDrag());
    }
  }

  private createDrag(): any {
    const plotMaker = this;
    return d3.behavior
      .drag()
      .origin(function(datum: any) {
        const traceIx = plotMaker.getTraceIndexForPoint(this);
        const setIx = plotMaker.getSetIndexForTraceIndex(traceIx);
        const yScale = plotMaker.createYScale(setIx);
        let initialValue = plotMaker.getInitialValue(setIx, datum.i);
        initialValue = isNumeric(initialValue) ? toNumber(initialValue) : initialValue;
        const lastValue = initialValue;

        const traceSetAxis = plotMaker.traceSet(setIx);
        const axisCategory = traceSetAxis && traceSetAxis.category;
        const config = traceSetAxis && traceSetAxis.config;

        let pointData: PointData = {traceIx, setIx, yScale, initialValue, lastValue, axisCategory, config};

        if (isNotNullOrUndefined(datum.y)) {
          const initialY = yScale.invert(initialValue as any);
          const event = d3.event as MouseEvent;
          const offset = plotMaker.getElementOffset(event.target as Element);
          const elementClickedY = event.pageY - offset.top;
          const clickedY = elementClickedY + initialY;

          pointData = {...pointData, initialY, offset, clickedY};
        }

        this.pointData = pointData;

        return plotMaker.getPointPosition(this, datum);
      })
      .on('drag', function(datum: any) {
        const pointData: PointData = this.pointData;

        const index = datum.i;
        const newValue = plotMaker.getNewValue(this, datum, d3.event);

        const set = plotMaker.chartData.sets[pointData.setIx];
        const setId = set.id;
        const pointId = set && set.points[datum.i].id;

        const canDrag = !!setId && !!pointId;

        if (canDrag && newValue !== pointData.lastValue) {
          this.newValue = newValue;
          pointData.lastValue = this.newValue;
          const dataChange = {trace: pointData.traceIx, axis: 'y', index, value: this.newValue};
          plotMaker.onDataChanged && plotMaker.onDataChanged(dataChange);
        }
      })
      .on('dragend', function(datum: any) {
        const pointData: PointData = this.pointData;

        const set = plotMaker.chartData.sets[pointData.setIx];
        const setId = set.id;
        const resourceType = set.resourceType;
        const pointId = set && set.points[datum.i].id;
        const value = this.newValue;
        const valueChanged = value !== pointData.initialValue;

        valueChanged &&
          pointId &&
          setId &&
          isNotNullOrUndefined(value) &&
          plotMaker.onValueChanged &&
          plotMaker.onValueChanged({pointId, setId, value, resourceType: resourceType});
      });
  }

  private getInitialValue(setIx: number, index: number): string | number {
    return this.chartData.sets[setIx].points[index].y;
  }

  private traceSet(setIx: number): ChartDataSetAxis {
    return this.chartData.sets[setIx].yAxis;
  }

  private getElementOffset(element: Element) {
    const bound = element.getBoundingClientRect();
    const html = document.documentElement;

    return {
      top: bound.top + window.pageYOffset - html.clientTop,
      left: bound.left + window.pageXOffset - html.clientLeft,
    };
  }

  private getNewValue(point: any, datum: any, event: any): string | number {
    const pointData: PointData = point.pointData;

    const newY = this.getPointNewY(point, datum, event);
    const newValue = pointData.yScale(newY);

    if (pointData.axisCategory === ChartAxisCategory.Duration) {
      return Math.max(toNumber(newValue), 0);
    }

    if (pointData.axisCategory === ChartAxisCategory.Date) {
      const config = pointData.config && (pointData.config as DateTimeConstraintConfig);
      return moment(new Date(newValue)).format(convertChartDateFormat(config && config.format));
    }

    if (!this.isNumericCategory(pointData.axisCategory)) {
      return newValue.toString();
    }

    const initialValue = pointData.initialValue;
    if (this.isDecimal(+initialValue)) {
      return Number.parseFloat(newValue.toString()).toFixed(2);
    } else {
      return Math.round(+newValue);
    }
  }

  public destroyDrag() {
    this.getPoints().on('.drag', null);
  }

  protected isDecimal(value: number): boolean {
    return value % 1 !== 0;
  }
}

export interface PointData {
  traceIx: number;
  setIx: number;
  yScale: (val: number) => string | number;
  initialValue: string | number;
  lastValue: string | number;
  axisCategory: ChartAxisCategory;
  config: ConstraintConfig;
  initialY?: number;
  offset?: {top: number; left: number};
  clickedY?: number;
}

interface YScaleCategories {
  (x: number): string;

  invert(y: string): number;
}
