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

import {ChartAxis, ChartAxisType, ChartType} from '../../../../../core/store/charts/chart';
import {Data, Layout} from 'plotly.js';
import {AxisDraggablePlotMaker} from './axis-draggable-plot-maker';
import * as d3 from 'd3';

export class LinePlotMaker extends AxisDraggablePlotMaker {
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

  private createAxis1Data(xAxis?: ChartAxis, yAxis?: ChartAxis): Data {
    const dataStyle = this.getDataStyle();
    return this.createAxesData(dataStyle, ChartAxisType.Y1, xAxis, yAxis);
  }

  private createAxis2Data(xAxis?: ChartAxis, yAxis?: ChartAxis): Data {
    const dataStyle = this.getDataStyle();
    const data = this.createAxesData(dataStyle, ChartAxisType.Y2, xAxis, yAxis);
    return {
      ...data,
      yaxis: 'y2',
      line: {
        dash: 'dot',
        width: 4,
      },
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

  private createAxesData(dataStyle: Data, yAxisType: ChartAxisType, xAxis?: ChartAxis, yAxis?: ChartAxis): Data {
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
        // we need to add first and last category value to the values in order to keep them on y axis while drag
        if (yValue && isYCategory && !addedYValues.has(yValue)) {
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
      legend: {
        xanchor: 'left',
        x: 1.1,
      },
    };
  }

  public currentType(): ChartType {
    return ChartType.Line;
  }

  public getPointNewY(point: any, datum: any, event: any): number {
    return event.y;
  }

  public getPoints(): d3.Selection<any> {
    return d3.selectAll('.scatterlayer .trace:last-of-type .points path');
  }

  public getTraceIndexForPoint(point: any): number {
    const traceIds = this.getLayoutElement()._traceUids;
    const traceClasses = (traceIds && traceIds.map(id => 'trace' + id)) || [];
    let node = d3.select(point).node() as Element;
    while (node) {
      const classList = node.classList;
      for (let i = 0; i < traceClasses.length; i++) {
        if (classList && classList.contains(traceClasses[i])) {
          return i;
        }
      }
      node = node.parentNode as Element;
    }

    return 0;
  }

  public getPointPosition(point: any, datum: any): {x: number; y: number} {
    const transform = d3.select(point).attr('transform');
    const translate = transform.substring(10, transform.length - 1).split(/[, ]/);
    return {x: +translate[0], y: +translate[1]};
  }
}
