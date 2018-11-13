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

import {PlotMaker} from './plot-maker';
import {ChartAxisModel, ChartAxisType, ChartType} from '../../../../../core/store/charts/chart.model';
import {d3, Data, Layout} from 'plotly.js';
import {hex2rgba} from '../../../../../shared/utils/html-modifier';

export class BarPlotMaker extends PlotMaker {
  public createData(): Data[] {
    const data: Data[] = [];

    const xAxis = this.config.axes[ChartAxisType.X];
    const y1Axis = this.config.axes[ChartAxisType.Y1];
    const y2Axis = this.config.axes[ChartAxisType.Y2];

    if (xAxis && y1Axis && y2Axis) {
      data.push(this.createAxis1Data(xAxis, y1Axis));
      // workaround data to group columns with multiple axes
      data.push(...this.createHelperData(xAxis, y1Axis, y2Axis));
      data.push(this.createAxis2Data(xAxis, y2Axis));
    } else if (!y1Axis && (xAxis || y2Axis)) {
      data.push(this.createAxis2Data(xAxis, y2Axis));
    } else if (xAxis || y1Axis) {
      data.push(this.createAxis1Data(xAxis, y1Axis));
    }

    return data;
  }

  private createHelperData(xAxis: ChartAxisModel, y1Axis: ChartAxisModel, y2Axis: ChartAxisModel): any[] {
    const values = this.findAxesNonNullAttributeValues(xAxis.attributeId, y1Axis.attributeId, y2Axis.attributeId);
    if (values.length < 2) {
      return [];
    }

    const dataY = {x: [values[0].x], y: [values[0].y], showlegend: false, type: 'bar', hoverinfo: 'none'};
    const dataY2 = {x: [values[1].x], y: [values[1].y], yaxis: 'y2', showlegend: false, type: 'bar', hoverinfo: 'none'};
    return [dataY, dataY2];
  }

  private findAxesNonNullAttributeValues(xAttrId: string, y1AttrId: string, y2AttrId: string): { x: string, y: string }[] {
    let yValue: { x: string, y: string } = null;
    let y2Value: { x: string, y: string } = null;
    const isY1Category = this.isAxisCategory(ChartAxisType.Y1);
    const isY2Category = this.isAxisCategory(ChartAxisType.Y2);
    for (const document of this.documents) {
      const x = document.data[xAttrId];
      const y = document.data[y1AttrId];
      const y2 = document.data[y2AttrId];

      if (!yValue && x && y) {
        yValue = {x, y: isY1Category ? y : '0'};
      }

      if (!y2Value && x && y2) {
        y2Value = {x, y: isY2Category ? y2 : '0'};
      }

      if (yValue && y2Value) {
        break;
      }
    }
    return [yValue, y2Value].filter(val => !!val);
  }

  private createAxis1Data(xAxis?: ChartAxisModel, yAxis?: ChartAxisModel): Data {
    const dataStyle = this.getDataStyle(ChartAxisType.Y1);
    return this.createAxesData(dataStyle, ChartAxisType.Y1, xAxis, yAxis);
  }

  private createAxis2Data(xAxis?: ChartAxisModel, yAxis?: ChartAxisModel): Data {
    const dataStyle = this.getDataStyle(ChartAxisType.Y2);
    const data = this.createAxesData(dataStyle, ChartAxisType.Y2, xAxis, yAxis);
    return {...data, yaxis: 'y2'};
  }

  private getDataStyle(yAxisType: ChartAxisType): Data {
    const trace = {};
    trace['type'] = 'bar';

    if (this.documents && this.documents[0]) {
      const collectionColor = this.getCollectionColor(this.documents[0].collectionId);
      const color = hex2rgba(collectionColor, yAxisType === ChartAxisType.Y1 ? 0.9 : 0.5);
      trace['marker'] = {color};
    }

    return trace;
  }

  private getCollectionColor(id: string): string {
    const collection = this.collections.find(coll => coll.id === id);
    return collection && collection.color;
  }

  private createAxesData(dataStyle: Data, yAxisType: ChartAxisType, xAxis?: ChartAxisModel, yAxis?: ChartAxisModel): Data {
    const data = {...dataStyle};

    const traceX = [];
    const traceY = [];

    const isYCategory = this.isAxisCategory(yAxisType);
    const additionalYValues = [];
    const addedYValues = new Set();

    for (const document of this.documents) {
      if (xAxis) {
        traceX.push(document.data[xAxis.attributeId]);
      }
      if (yAxis) {
        const yValue = document.data[yAxis.attributeId];
        traceY.push(yValue);
        if (yValue && isYCategory && !addedYValues.has(yValue)) {
          // we need to add first and last category value to the values in order to keep them on y axis while drag
          const insertIndex = additionalYValues.length === 0 ? 0 : 1;
          additionalYValues[insertIndex] = yValue;
          addedYValues.add(yValue);
        }
      }
    }

    for (let i = 0; i < additionalYValues.length; i++) {
      traceX.push(null);
      traceY.push(additionalYValues[i]);
    }

    const name = yAxis && this.getAttributeName(yAxis.attributeId);
    if (name) {
      data['name'] = name;
    }

    if (xAxis) {
      data['x'] = traceX;
    }

    if (yAxis) {
      data['y'] = traceY;
    }

    return data;
  }

  private getAttributeName(attributeId: string): string {
    const collectionId = this.documents && this.documents[0] && this.documents[0].collectionId;
    const collection = collectionId && this.collections.find(coll => coll.id === collectionId);
    const attribute = collection && collection.attributes.find(attr => attr.id === attributeId);
    return attribute && attribute.name;
  }

  public createLayout(): Partial<Layout> {
    return {...this.yAxis1Layout(), ... this.yAxis2Layout(), ...this.otherLayout()};
  }

  private yAxis1Layout(): Partial<Layout> {
    const type = ChartAxisType.Y1;
    if (this.config.axes[type] && this.isAxisCategory(type)) {
      return {
        yaxis: {
          type: 'category',
          categoryarray: this.getYAxisCategories(type)
        }
      };
    }
    return {};
  }

  private yAxis2Layout(): Partial<Layout> {
    const type = ChartAxisType.Y2;

    if (this.config.axes[type]) {
      if (this.isAxisCategory(type)) {
        return {
          yaxis2: {
            overlaying: 'y',
            side: 'right',
            type: 'category',
            categoryarray: this.getYAxisCategories(type)
          }
        };
      }

      return {
        yaxis2: {
          overlaying: 'y',
          side: 'right'
        }
      };
    }
  }

  private otherLayout(): Partial<Layout> {
    return {
      barmode: 'group',
      legend: {
        xanchor: 'left',
        x: 1.1
      }
    };
  }

  private isAxisCategory(type: ChartAxisType): boolean {
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

  private getYAxisCategories(type: ChartAxisType): string[] {
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

  public currentType(): ChartType {
    return ChartType.Bar;
  }

  public initDrag() {
    this.destroyDrag();

    this.assignDrag(this.createDrag());
  }

  private assignDrag(drag: any) {
    this.getPoints().call(drag);
  }

  private createDrag(): any {
    const plotMaker = this;
    return d3.behavior.drag()
      .origin(function (datum) {
        this.traceIx = plotMaker.getTraceIndexForPoint(this);
        this.yScale = plotMaker.createYScale(this.traceIx);
        this.initialValue = plotMaker.getInitialValue(this.traceIx, datum.i);
        this.lastValue = this.initialValue;
        this.isCategory = plotMaker.isTraceCategory(this.traceIx);
        this.initialY = datum.ct[1];
        this.offset = plotMaker.getOffset(d3.event.target);
        const elementClickedY = d3.event.pageY - this.offset.top;
        this.clickedY = elementClickedY + this.initialY;

        return {x: datum.x, y: this.clickedY};
      })
      .on('drag', function (datum) {
        const yMouse = d3.event.sourceEvent.pageY - this.offset.top + datum.ct[1];
        const index = datum.i;
        this.newValue = plotMaker.getNewValue(this, yMouse);

        if (this.newValue !== this.lastValue) {
          this.lastValue = this.newValue;
          const dataChange = {trace: this.traceIx, axis: 'y', index, value: this.newValue};
          plotMaker.onDataChanged && plotMaker.onDataChanged(dataChange);
        }
      })
      .on('dragend', function (datum) {
        const documentId = plotMaker.documents[datum.i].id;
        const attributeId = plotMaker.getAttributeIdForTrace(this.traceIx);
        const value = this.newValue;

        documentId && attributeId && value &&
        plotMaker.onValueChanged && plotMaker.onValueChanged({documentId, attributeId, value});
      });
  }

  private getTraceIndexForPoint(point: any): number {
    const barsContainers = d3.selectAll('.barlayer .trace .points')[0];
    const pointNode = d3.select(point).node().parentNode;

    for (let i = 0; i < barsContainers.length; i++) {
      const children = barsContainers[i].children;

      if (Array.from(children).find(p => p === pointNode)) {
        return i;
      }
    }

    return 0;
  }

  private getInitialValue(traceIx: number, index: number): any {
    const attributeId = this.getAttributeIdForTrace(traceIx);
    return this.documents[index].data[attributeId];
  }

  private isTraceCategory(index: number): boolean {
    if (index > 0 || !this.config.axes[ChartAxisType.Y1]) {
      return this.isAxisCategory(ChartAxisType.Y2);
    }
    return this.isAxisCategory(ChartAxisType.Y1);
  }

  private getOffset(element: HTMLElement) {
    const bound = element.getBoundingClientRect();
    const html = document.documentElement;

    return {
      top: bound.top + window.pageYOffset - html.clientTop,
      left: bound.left + window.pageXOffset - html.clientLeft
    };
  }

  private getNewValue(point: any, y: number): any {
    const dy = y - point.clickedY;
    const newY = point.initialY + dy;
    const newValue = point.yScale(newY);

    if (point.isCategory) {
      return newValue.toString();
    }

    const initialValue = point.initialValue;

    if (this.isDecimal(initialValue)) {
      return Number.parseFloat(newValue).toFixed(2);
    } else {
      return Math.round(newValue);
    }
  }

  private createYScale(traceIndex: number): any {
    const yAxisElement = this.getYAxisElementForTrace(traceIndex);
    if (yAxisElement.type === 'category') {
      return this.createYScaleCategories(yAxisElement);
    }
    return this.createYScaleLinear(yAxisElement);
  }

  private createYScaleLinear(yAxisElement: any): any {
    return d3.scale.linear()
      .domain([this.getGridHeight(), 0])
      .range(yAxisElement.range);
  }

  private createYScaleCategories(yAxisElement: any): any {
    const yAxisMargin = this.computeYMarginCategories(yAxisElement);
    const gridHeight = this.getGridHeight();
    const categories = yAxisElement._categories;
    const domainStep = (gridHeight - 2 * yAxisMargin) / (categories.length - 1);
    const domainRange = d3.range(yAxisMargin + domainStep / 2, gridHeight - yAxisMargin, domainStep);
    const domain = domainRange.reverse();

    return (value) => {
      for (let i = 0; i < domain.length; i++) { // TODO binary search
        if (value > domain[i]) {
          return categories[i];
        }
      }
      return categories.length > 0 ? categories[categories.length - 1] : null;
    };
  }

  private computeYMarginCategories(yAxisElement: any): number {
    const downRange = Math.abs(yAxisElement.range[0]);
    const upRange = Math.abs(yAxisElement.range[1]);
    const range = downRange + upRange;
    return (this.getGridHeight() / range) * downRange;
  }

  private getGridHeight(): number {
    const element = this.getLayoutElement();
    return element.height - element.margin.t - element.margin.b;
  }

  private getAttributeIdForTrace(index: number): string {
    if (index > 0 || !this.config.axes[ChartAxisType.Y1]) {
      return this.config.axes[ChartAxisType.Y2].attributeId;
    }
    return this.config.axes[ChartAxisType.Y1].attributeId;
  }

  private getYAxisElementForTrace(index: number): any {
    if (index > 0 || !this.config.axes[ChartAxisType.Y1]) {
      return this.getLayoutElement().yaxis2;
    }
    return this.getLayoutElement().yaxis;
  }


  private getLayoutElement(): any {
    return this.element.nativeElement._fullLayout;
  }

  private isNumeric(value: any): boolean {
    return !isNaN(value);
  }

  private isDecimal(value: number): boolean {
    return value % 1 !== 0;
  }


  private getPoints(): any {
    return d3.selectAll('.barlayer .trace .points .point path');
  }

  public destroyDrag() {
    this.getPoints().on('.drag', null);
  }
}
