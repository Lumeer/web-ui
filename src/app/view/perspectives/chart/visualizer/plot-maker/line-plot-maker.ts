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

import {DEFAULT_GRID_HEIGHT, PlotMaker} from './plot-maker';
import {ChartAxisModel, ChartAxisType, ChartType} from '../../../../../core/store/charts/chart.model';
import {d3, Data, Layout} from 'plotly.js';

export class LinePlotMaker extends PlotMaker {

  public createData(): Data[] {
    const data: Data[] = [];

    const xAxis = this.config.axes[ChartAxisType.X];
    const y1Axis = this.config.axes[ChartAxisType.Y1];
    const y2Axis = this.config.axes[ChartAxisType.Y2];

    if (y1Axis && y2Axis) {
      data.push(this.createAxis1Data(xAxis, y1Axis));
      data.push(this.createAxis2Data(xAxis, y2Axis));
    } else if (!y1Axis && (xAxis || y2Axis)) {
      data.push(this.createAxis2Data(xAxis, y2Axis));
    } else if (xAxis || y1Axis) {
      data.push(this.createAxis1Data(xAxis, y1Axis));
    }

    return data;
  }

  private createAxis1Data(xAxis?: ChartAxisModel, yAxis?: ChartAxisModel): Data {
    const dataStyle = this.getDataStyle();
    return this.createAxesData(dataStyle, ChartAxisType.Y1, xAxis, yAxis);
  }

  private createAxis2Data(xAxis?: ChartAxisModel, yAxis?: ChartAxisModel): Data {
    const dataStyle = this.getDataStyle();
    const data = this.createAxesData(dataStyle, ChartAxisType.Y2, xAxis, yAxis);
    return {
      ...data,
      yaxis: 'y2',
      line: {
        dash: 'dot',
        width: 4
      }
    };
  }

  private getDataStyle(): Data {
    const trace = {};
    trace['mode'] = 'lines+markers';
    trace['type'] = 'scatter';

    if (this.documents && this.documents[0]) {
      const color = this.getCollectionColor(this.documents[0].collectionId);
      trace['marker'] = {color, size: 10};
      trace['line'] = {color};
    } else {
      trace['marker'] = {size: 10};
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

    for (const document of this.documents) {
      if (xAxis) {
        traceX.push(document.data[xAxis.attributeId]);
      }
      if (yAxis) {
        const yValue = document.data[yAxis.attributeId];
        traceY.push(yValue);
        // we need to add first and last category value to the values in order to keep them on y axis while drag
        if (yValue && isYCategory) {
          const insertIndex = additionalYValues.length === 0 ? 0 : 1;
          additionalYValues[insertIndex] = yValue;
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
    return ChartType.Line;
  }

  public initDrag() {
    this.destroyDrag();

    if (this.canDragPoints()) {
      this.assignDrag(this.createDrag());
    }
  }

  private createDrag(): any {
    const plotMaker = this;
    return d3.behavior.drag()
      .origin(function (datum) {
        const traceIx = plotMaker.getTraceIndexForPoint(this);
        this.yScale = plotMaker.createYScale(traceIx);
        this.traceIx = traceIx;
        this.initialValue = plotMaker.getInitialValue(traceIx, datum.i);
        return plotMaker.getPointPosition(this);
      })
      .on('drag', function (datum) {
        const yMouse = d3.event.y;
        const index = datum.i;
        this.newValue = plotMaker.getNewValue(this, yMouse);

        const dataChange = {trace: this.traceIx, axis: 'y', index, value: this.newValue};
        plotMaker.onDataChanged && plotMaker.onDataChanged(dataChange);
      })
      .on('dragend', function (datum) {
        const documentId = plotMaker.documents[datum.i].id;
        const attributeId = plotMaker.getAttributeIdForTrace(this.traceIx);
        const value = this.newValue;

        if (documentId && attributeId && value && plotMaker.onValueChanged) {
          plotMaker.onValueChanged({documentId, attributeId, value});
        }

      });
  }

  private getInitialValue(traceIx: number, index: number): any {
    const attributeId = this.getAttributeIdForTrace(traceIx);
    return this.documents[index].data[attributeId];
  }

  private getNewValue(point: any, y: number): any {
    let newValue = point.yScale(y);
    if (this.isNumeric(newValue)) {
      const initialValue = point.initialValue;
      if (this.isDecimal(initialValue)) {
        newValue = Number.parseFloat(newValue).toFixed(2);
      } else {
        newValue = Math.round(newValue);
      }
    } else {
      newValue = newValue.toString();
    }
    return newValue;
  }

  private canDragPoints(): boolean {
    return this.config && (!!this.config.axes[ChartAxisType.Y1] || !!this.config.axes[ChartAxisType.Y2]);
  }

  public destroyDrag() {
    this.getPoints().on('.drag', null);
  }

  private assignDrag(drag: any) {
    this.getPoints().call(drag);
  }

  public dragEnabledChange() {
    this.refreshDrag();
  }

  public onRelayout() {
    this.refreshDrag();
  }

  private refreshDrag() {
    if (this.dragEnabled) {
      this.initDrag();
    } else {
      this.destroyDrag();
    }
  }

  private getPoints(): any {
    return d3.selectAll('.scatterlayer .trace:last-of-type .points path');
  }

  private getTraceIndexForPoint(point: any): number {
    const traceIds = this.getLayoutElement()._traceUids;
    const traceClasses = traceIds && traceIds.map(id => 'trace' + id) || [];
    let node = d3.select(point).node();
    while (node) {
      const classList = node.classList;
      for (let i = 0; i < traceClasses.length; i++) {
        if (classList && classList.contains(traceClasses[i])) {
          return i;
        }
      }
      node = node.parentNode;
    }

    return 0;
  }

  private getPointPosition(point: any): { x: number, y: number } {
    const transform = d3.select(point).attr('transform');
    const translate = transform.substring(10, transform.length - 1).split(/,| /);
    return {x: translate[0], y: translate[1]};
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
    const gridElement = d3.select('.gridlayer').node();
    const boundingRect = gridElement && gridElement.getBoundingClientRect();
    return boundingRect && boundingRect.height || DEFAULT_GRID_HEIGHT;
  }

  private getAttributeIdForTrace(index: number): string {
    if (index === 1 || !this.config.axes[ChartAxisType.Y1]) {
      return this.config.axes[ChartAxisType.Y2].attributeId;
    }
    return this.config.axes[ChartAxisType.Y1].attributeId;
  }

  private getYAxisElementForTrace(index: number): any {
    if (index === 1 || !this.config.axes[ChartAxisType.Y1]) {
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

}
