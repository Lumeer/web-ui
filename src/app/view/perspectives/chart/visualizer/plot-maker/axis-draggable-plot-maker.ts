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
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {DraggablePlotMaker} from './draggable-plot-maker';
import * as d3 from 'd3';

export abstract class AxisDraggablePlotMaker extends DraggablePlotMaker {
  public abstract getPoints(): any;

  public abstract getTraceIndexForPoint(point: any): number;

  public abstract getPointPosition(point: any, datum: any): {x: number; y: number};

  public abstract getPointNewY(point: any, datum: any, event: any): number;

  protected yAxis1Layout(): Partial<Layout> {
    const type = ChartAxisType.Y1;
    if (this.config.axes[type] && this.isAxisCategory(type)) {
      return {
        yaxis: {
          type: 'category',
          categoryarray: this.getYAxisCategories(type),
        },
      };
    }
    return {};
  }

  protected yAxis2Layout(): Partial<Layout> {
    const type = ChartAxisType.Y2;

    if (this.config.axes[type]) {
      if (this.isAxisCategory(type)) {
        return {
          yaxis2: {
            overlaying: 'y',
            side: 'right',
            type: 'category',
            categoryarray: this.getYAxisCategories(type),
          },
        };
      }

      return {
        yaxis2: {
          overlaying: 'y',
          side: 'right',
        },
      };
    }
  }

  protected isAxisCategory(type: ChartAxisType): boolean {
    const axis = this.config.axes[type];
    if (!axis) {
      return false;
    }
    for (const document of this.documents) {
      const value = document.data[axis.attributeId];
      if (value && !this.isNumeric(value)) {
        return true;
      }
    }

    return false;
  }

  protected getYAxisCategories(type: ChartAxisType): string[] {
    const axis = this.config.axes[type];
    if (!axis) {
      return [];
    }

    return this.documents.reduce((values, document) => {
      const value = document.data[axis.attributeId];
      if (value && !values.includes(value)) {
        values.push(value);
      }
      return values;
    }, []);
  }

  protected createYScale(traceIndex: number): (val: number) => any {
    const yAxisElement = this.getYAxisElementForTrace(traceIndex);
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
        // TODO binary search
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

  protected getAttributeIdForTrace(index: number): string {
    if (index > 0 || !this.config.axes[ChartAxisType.Y1]) {
      return this.config.axes[ChartAxisType.Y2].attributeId;
    }
    return this.config.axes[ChartAxisType.Y1].attributeId;
  }

  protected getYAxisElementForTrace(index: number): any {
    if (index > 0 || !this.config.axes[ChartAxisType.Y1]) {
      return this.getLayoutElement().yaxis2;
    }
    return this.getLayoutElement().yaxis;
  }

  protected getLayoutElement(): any {
    return this.element.nativeElement._fullLayout;
  }

  protected canDragPoints(): boolean {
    return this.config && (!!this.config.axes[ChartAxisType.Y1] || !!this.config.axes[ChartAxisType.Y2]);
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
        const yScale = plotMaker.createYScale(traceIx);
        const initialValue = plotMaker.getInitialValue(traceIx, datum.i);
        const lastValue = initialValue;
        const isCategory = plotMaker.isTraceCategory(traceIx);

        let pointData: PointData = {traceIx, yScale, initialValue, lastValue, isCategory};

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

        if (this.newValue !== pointData.lastValue) {
          pointData.lastValue = this.newValue;
          const dataChange = {trace: pointData.traceIx, axis: 'y', index, value: this.newValue};
          plotMaker.onDataChanged && plotMaker.onDataChanged(dataChange);
        }
      })
      .on('dragend', function(datum: any) {
        const pointData: PointData = this.pointData;

        const documentId = plotMaker.documents[datum.i].id;
        const attributeId = plotMaker.getAttributeIdForTrace(pointData.traceIx);
        const value = this.newValue;

        documentId &&
          attributeId &&
          value &&
          plotMaker.onValueChanged &&
          plotMaker.onValueChanged({documentId, attributeId, value});
      });
  }

  private getInitialValue(traceIx: number, index: number): string | number {
    const attributeId = this.getAttributeIdForTrace(traceIx);
    return this.documents[index].data[attributeId];
  }

  private isTraceCategory(index: number): boolean {
    if (index > 0 || !this.config.axes[ChartAxisType.Y1]) {
      return this.isAxisCategory(ChartAxisType.Y2);
    }
    return this.isAxisCategory(ChartAxisType.Y1);
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

  protected isNumeric(value: any): boolean {
    return !isNaN(value);
  }

  protected isDecimal(value: number): boolean {
    return value % 1 !== 0;
  }
}

export interface PointData {
  traceIx: number;
  yScale: (val: number) => string | number;
  initialValue: string | number;
  lastValue: string | number;
  isCategory: boolean;
  initialY?: number;
  offset?: {top: number; left: number};
  clickedY?: number;
}
