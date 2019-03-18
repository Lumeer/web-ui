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
import {ChartDataSet, ChartYAxisType} from '../../data/convertor/chart-data';
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {isNotNullOrUndefined, isNullOrUndefined, isNumeric} from '../../../../../shared/utils/common.utils';
import {createRange} from './plot-util';

export abstract class AxisDraggablePlotMaker extends DraggablePlotMaker {
  public abstract getPoints(): any;

  public abstract getTraceIndexForPoint(point: any): number;

  public abstract getSetIndexForTraceIndex(traceIx: number): number;

  public abstract getPointPosition(point: any, datum: any): {x: number; y: number};

  public abstract getPointNewY(point: any, datum: any, event: any): number;

  protected yAxis1Layout(): Partial<Layout> {
    if (this.isAxisCategory(ChartAxisType.Y1)) {
      return {
        yaxis: {
          type: 'category',
          categoryarray: this.getYAxisCategories(ChartAxisType.Y1),
        },
      };
    }
    return {
      yaxis: {
        range: this.createRange(),
      },
    };
  }

  private createRange(): any[] {
    if (
      !this.areBothYAxisPresented() ||
      this.isAxisCategory(ChartAxisType.Y1) ||
      this.isAxisCategory(ChartAxisType.Y2)
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
    if (this.isY2AxisPresented()) {
      if (this.isAxisCategory(ChartAxisType.Y2)) {
        return {
          yaxis2: {
            overlaying: 'y',
            side: 'right',
            type: 'category',
            categoryarray: this.getYAxisCategories(ChartAxisType.Y2),
          },
        };
      }

      return {
        yaxis2: {
          overlaying: 'y',
          side: 'right',
          range: this.createRange(),
        },
      };
    }
    return {};
  }

  protected isAxisCategory(type: ChartYAxisType): boolean {
    const sets = this.getAxisDataSets(type);
    return sets.length === 1 && sets[0].isNumeric === false;
  }

  protected getAxisDataSets(type: ChartYAxisType): ChartDataSet[] {
    return this.chartData.sets.filter(set => set.yAxisType === type);
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
    }
    return this.createYScaleLinear(yAxisElement);
  }

  protected createYScaleLinear(yAxisElement: any): d3.scale.Linear<number, number> {
    return d3.scale
      .linear()
      .domain([this.getGridHeight(), 0])
      .range(yAxisElement.range);
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
        const isCategory = plotMaker.isTraceCategory(setIx);

        let pointData: PointData = {traceIx, setIx, yScale, initialValue, lastValue, isCategory};

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

  private isTraceCategory(setIx: number): boolean {
    return !this.chartData.sets[setIx].isNumeric;
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

    if (pointData.isCategory) {
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
  isCategory: boolean;
  initialY?: number;
  offset?: {top: number; left: number};
  clickedY?: number;
}
