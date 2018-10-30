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
import {ChartAxisModel, ChartAxisType, ChartConfig, ChartType} from '../../../../../core/store/charts/chart.model';
import {Data, Layout, d3} from 'plotly.js';
import {isNumber} from 'util';

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
    return this.createAxesData(dataStyle, xAxis, yAxis);
  }

  private createAxis2Data(xAxis?: ChartAxisModel, yAxis?: ChartAxisModel): Data {
    const dataStyle = this.getDataStyle();
    const data = this.createAxesData(dataStyle, xAxis, yAxis);
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

  private createAxesData(dataStyle: Data, xAxis?: ChartAxisModel, yAxis?: ChartAxisModel): Data {
    const data = {...dataStyle};

    const traceX = [];
    const traceY = [];

    for (const document of this.documents) {
      if (xAxis) {
        traceX.push(document.data[xAxis.attributeId]);
      }
      if (yAxis) {
        traceY.push(document.data[yAxis.attributeId]);
      }
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

  public createLayout(config: ChartConfig): Partial<Layout> {
    if (config.axes[ChartAxisType.Y2]) {
      return {
        yaxis2: {
          overlaying: 'y',
          side: 'right'
        },
        legend: {
          xanchor: 'left',
          x: 1.1
        }
      };
    }
    return {};
  }

  public currentType(): ChartType {
    return ChartType.Line;
  }

  public initDrag() {
    if (!this.canDragPoints()) {
      this.destroyDrag();
      return;
    }

    const plotMaker = this;
    const drag = d3.behavior.drag()
      .origin(function () {
        const traceIx = plotMaker.getTraceIndexForPoint(this);
        this.yScale = plotMaker.createYScale(traceIx);
        this.traceIx = traceIx;
        return plotMaker.getPointPosition(this);
      })
      .on('drag', function (datum) {
        const yMouse = d3.event.y;
        const index = datum.i;
        let newValue = this.yScale(yMouse);
        if (isNumber(newValue)) {
          newValue = Math.round(newValue);
        } else {
          newValue = newValue.toString();
        }
        this.newValue = newValue;

        const dataChange = {trace: this.traceIx, axis: 'y', index, value: newValue};
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

    this.element.nativeElement.on('plotly_relayout', () => this.assignDrag(drag));
    this.assignDrag(drag);
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
      return this.createYScaleOrdinal(yAxisElement);
    }
    return this.createYScaleLinear(yAxisElement);
  }

  private createYScaleLinear(yAxisElement: any): any {
    return d3.scale.linear()
      .domain([this.getGridHeight(), 0])
      .range(yAxisElement.range);
  }

  private createYScaleOrdinal(yAxisElement: any): any {
    const yAxisMargin = this.computeOrdinalYAxisMargin(yAxisElement);
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

  private computeOrdinalYAxisMargin(yAxisElement: any): number {
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

}
