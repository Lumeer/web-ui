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

import {ChartAxisModel, ChartAxisType, ChartType} from '../../../../../core/store/charts/chart.model';
import {Data, Layout} from 'plotly.js';
import {hex2rgba} from '../../../../../shared/utils/html-modifier';
import {AxisDraggablePlotMaker, PointData} from './axis-draggable-plot-maker';
import * as d3 from 'd3';

export class BarPlotMaker extends AxisDraggablePlotMaker {
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

  private findAxesNonNullAttributeValues(
    xAttrId: string,
    y1AttrId: string,
    y2AttrId: string
  ): {x: string; y: string}[] {
    let yValue: {x: string; y: string} = null;
    let y2Value: {x: string; y: string} = null;
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

  private createAxesData(
    dataStyle: Data,
    yAxisType: ChartAxisType,
    xAxis?: ChartAxisModel,
    yAxis?: ChartAxisModel
  ): Data {
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
    return {...this.yAxis1Layout(), ...this.yAxis2Layout(), ...this.otherLayout()};
  }

  private otherLayout(): Partial<Layout> {
    return {
      barmode: 'group',
      legend: {
        xanchor: 'left',
        x: 1.1,
      },
    };
  }

  public currentType(): ChartType {
    return ChartType.Bar;
  }

  public getPointPosition(point: any, datum: any): {x: number; y: number} {
    return {x: datum.x, y: point.clickedY};
  }

  public getTraceIndexForPoint(point: any): number {
    const barsContainers = d3.selectAll('.barlayer .trace .points')[0];
    const pointNode = d3.select(point).node().parentNode;

    for (let i = 0; i < barsContainers.length; i++) {
      const children = (barsContainers[i] as Element).children;

      if (Array.from(children).find(p => p === pointNode)) {
        return i;
      }
    }

    return 0;
  }

  public getPointNewY(point: any, datum: any, event: any): number {
    const pointData: PointData = point.pointData;
    const computedY = event.sourceEvent.pageY - pointData.offset.top + datum.ct[1];
    const dy = computedY - pointData.clickedY;
    return pointData.initialY + dy;
  }

  public getPoints(): d3.Selection<any> {
    return d3.selectAll('.barlayer .trace .points .point path');
  }
}
