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

import {Layout} from 'plotly.js';
import * as d3 from 'd3';
import {DraggablePlotMaker} from './draggable-plot-maker';
import {
  ChartAxisCategory,
  ChartDataSetAxis,
  ChartYAxisType,
  convertChartDateFormat,
} from '../../data/convertor/chart-data';
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {isNotNullOrUndefined, isNumeric} from '../../../../../shared/utils/common.utils';
import {createRange} from './plot-util';
import * as moment from 'moment';
import {ConstraintConfig, DateTimeConstraintConfig} from '../../../../../core/model/data/constraint';
import {convertChartDateTickFormat} from '../chart-util';

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
    }
    return {};
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
    } else if (category === ChartAxisCategory.Date) {
      const dateConfig = config as DateTimeConstraintConfig;
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

  private createRange(): any[] {
    if (
      !this.areBothYAxisPresented() ||
      !this.isNumericCategory(this.axisCategory(ChartAxisType.Y1)) ||
      !this.isNumericCategory(this.axisCategory(ChartAxisType.Y2))
    ) {
      return null;
    }

    const values = this.chartData.sets.reduce((allValues, set) => {
      const setValues = set.points
        .filter(point => isNotNullOrUndefined(point.y) && isNumeric(point.y))
        .map(point => point.y);
      return [...allValues, ...setValues];
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
    } else if (category === ChartAxisCategory.Date) {
      const dateConfig = config as DateTimeConstraintConfig;
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

  protected createYScale(setIx: number): (val: number) => any {
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

  protected createYScaleCategories(yAxisElement: any): (val: number) => string {
    const yAxisMargin = this.computeYMarginCategories(yAxisElement);
    const gridHeight = this.getGridHeight();
    const categories = yAxisElement._categories;
    const domainStep = (gridHeight - 2 * yAxisMargin) / (categories.length - 1);
    const domainRange = d3.range(yAxisMargin + domainStep / 2, gridHeight - yAxisMargin, domainStep);
    const domain = domainRange.reverse();

    return value => {
      for (let i = 0; i < domain.length; i++) {
        if (value > domain[i]) {
          return categories[i];
        }
      }
      return categories.length > 0 ? categories[categories.length - 1] : null;
    };
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
        const initialValue = plotMaker.getInitialValue(setIx, datum.i);
        const lastValue = initialValue;

        const traceSetAxis = plotMaker.traceSet(setIx);
        const axisCategory = traceSetAxis && traceSetAxis.category;
        const config = traceSetAxis && traceSetAxis.config;

        let pointData: PointData = {traceIx, setIx, yScale, initialValue, lastValue, axisCategory, config};

        if (datum.ct) {
          const initialY = datum.ct[1];
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
        this.newValue = plotMaker.getNewValue(this, datum, d3.event);

        const set = plotMaker.chartData.sets[pointData.setIx];
        const setId = set.id;
        const pointId = set && set.points[datum.i].id;

        const canDrag = !!setId && !!pointId;

        if (canDrag && this.newValue !== pointData.lastValue) {
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

        pointId &&
          setId &&
          value &&
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
