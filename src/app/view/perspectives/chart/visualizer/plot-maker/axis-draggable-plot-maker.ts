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

import * as moment from 'moment';
import {d3} from 'plotly.js';
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {isNotNullOrUndefined, isNumeric, toNumber} from '../../../../../shared/utils/common.utils';
import {DraggablePlotMaker} from './draggable-plot-maker';
import {ChartAxisData} from '../../data/convertor/chart-data';
import {Constraint, ConstraintType, DateTimeConstraint} from '@lumeer/data-filters';

export abstract class AxisDraggablePlotMaker extends DraggablePlotMaker {
  public abstract getTraceIndexForPoint(point: any): number;

  public abstract getSetIndexForTraceIndex(traceIx: number): number;

  public abstract getPointPosition(point: any, datum: any): {x: number; y: number};

  public abstract getPointNewY(point: any, datum: any, event: any): number;

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
    return d3.scale.linear().domain([this.getGridHeight(), 0]).range(yAxisElement.range);
  }

  protected createYScaleTime(yAxisElement: any): d3.scale.Linear<number, number> {
    const date1 = moment(yAxisElement.range[0]).toDate().getTime();
    const date2 = moment(yAxisElement.range[1]).toDate().getTime();

    return d3.scale.linear().domain([this.getGridHeight(), 0]).rangeRound([date1, date2]);
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
      .origin(function (datum: any) {
        const traceIx = plotMaker.getTraceIndexForPoint(this);
        const setIx = plotMaker.getSetIndexForTraceIndex(traceIx);
        const yScale: any = plotMaker.createYScale(setIx);
        let initialValue = plotMaker.getInitialValue(setIx, datum.i);
        initialValue = isNumeric(initialValue) ? toNumber(initialValue) : initialValue;
        const lastValue = initialValue;

        const traceSet = plotMaker.traceData(setIx);
        const constraintType = traceSet?.constraintType;
        const constraint = traceSet?.constraint;

        let pointData: PointData = {traceIx, setIx, yScale, initialValue, lastValue, constraintType, constraint};

        if (isNotNullOrUndefined(datum.y)) {
          const initialY = yScale.invert(initialValue);
          const event = d3.event as MouseEvent;
          const offset = plotMaker.getElementOffset(event.target as Element);
          const elementClickedY = event.pageY - offset.top;
          const clickedY = elementClickedY + initialY;

          pointData = {...pointData, initialY, offset, clickedY};
        }

        this.pointData = pointData;

        return plotMaker.getPointPosition(this, datum);
      })
      .on('drag', function (datum: any) {
        const pointData: PointData = this.pointData;

        const index = datum.i;
        const newValue = plotMaker.getNewValue(this, datum, d3.event, pointData.constraint);

        const set = plotMaker.chartData.sets[pointData.setIx];
        const setId = set.id;
        const pointId = set && set.points[datum.i].id;

        const canDrag = !!setId && !!pointId;

        if (canDrag && newValue !== pointData.lastValue) {
          this.newValue = newValue;
          pointData.lastValue = this.newValue;
          const dataChange = {trace: pointData.traceIx, axis: 'y', index, value: this.newValue};
          plotMaker.onDataChanged?.(dataChange);
        }
      })
      .on('dragend', function (datum: any) {
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
          plotMaker.onValueChanged?.({pointId, setId, value, resourceType: resourceType});
      });
  }

  private traceData(setIx: number): ChartAxisData {
    const set = this.chartData.sets[setIx];
    if (set?.yAxisType === ChartAxisType.Y2) {
      return this.chartData.y2AxisData;
    }

    return this.chartData.y1AxisData;
  }

  private getInitialValue(setIx: number, index: number): string | number {
    return this.chartData.sets[setIx]?.points[index]?.y;
  }

  private getElementOffset(element: Element) {
    const bound = element.getBoundingClientRect();
    const html = document.documentElement;

    return {
      top: bound.top + window.pageYOffset - html.clientTop,
      left: bound.left + window.pageXOffset - html.clientLeft,
    };
  }

  private getNewValue(point: any, datum: any, event: any, constraint: Constraint): any {
    const pointData: PointData = point.pointData;

    const newY = this.getPointNewY(point, datum, event);
    const newValue = pointData.yScale(newY);

    if (pointData.constraintType === ConstraintType.Duration) {
      return Math.max(toNumber(newValue), 0);
    }

    if (pointData.constraintType === ConstraintType.DateTime) {
      const date = isNumeric(newValue) ? new Date(toNumber(newValue)) : newValue;
      return (<DateTimeConstraint>constraint).createDataValue(date).momentDate.toDate();
    }

    if (!this.isNumericType(pointData.constraintType)) {
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
  constraintType: ConstraintType;
  constraint: Constraint;
  initialY?: number;
  offset?: {top: number; left: number};
  clickedY?: number;
}

interface YScaleCategories {
  (x: number): string;

  invert(y: string): number;
}
