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
import {ChartAxisModel, ChartAxisType, ChartConfig, ChartType} from '../../../../../core/store/charts/chart.model';
import {Data, Layout, d3} from 'plotly.js';

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
    const drag = d3.behavior.drag();
    const plotMaker = this;
    drag.origin(function () {
      this.yScale = plotMaker.createScale(this.traceIx);
      return plotMaker.getPointPosition(this);
    });
    drag.on('drag', function (d) {
      const xmouse = d3.event.x, ymouse = d3.event.y;
      const currentPosition = plotMaker.getPointPosition(this);
      d3.select(this).attr('transform', 'translate(' + [currentPosition.x, ymouse] + ')');

      const index = d.i;
      const newData = plotMaker.createData();
      const newValue = this.yScale(ymouse).toString();
      newData[this.traceIx]['y'][index] = newValue;

      this.newValue = newValue;

      plotMaker.onDataChanged && plotMaker.onDataChanged(newData);
    });
    drag.on('dragend', function (d) {
      const documentId = plotMaker.documents[d.i].id;
      const attributeId = this.attrId;
      const value = this.newValue;

      if (documentId && attributeId && value && plotMaker.onValueChanged) {
        plotMaker.onValueChanged(documentId, attributeId, value);
      }

    });

    d3.selectAll('.scatterlayer .trace:last-of-type .points path').call(drag);

    this.setDragPointsIds();
  }

  private getPointPosition(point: any): { x: number, y: number } {
    const transform = d3.select(point).attr('transform');
    const translate = transform.substring(10, transform.length - 1).split(/,| /);
    return {x: translate[0], y: translate[1]};
  }

  private createScale(traceIndex: number): any {
    const range = this.getRangeForTrace(traceIndex);
    return d3.scale.linear()
      .domain([270, 0]) // TODO get height
      .range(range);
  }

  private getRangeForTrace(index: number): any {
    if (index === 1 || !this.config.axes[ChartAxisType.Y1]) {
      return this.element.nativeElement._fullLayout.yaxis2.range;
    }
    return this.element.nativeElement._fullLayout.yaxis.range;
  }

  private setDragPointsIds() {
    const points = d3.selectAll('.scatterlayer .trace:last-of-type .points path')[0];
    const xAxis = this.config.axes[ChartAxisType.X];
    const y1Axis = this.config.axes[ChartAxisType.Y1];
    let pointIndex = 0;
    let traceIndex = 0;
    if (y1Axis) {
      for (const document of this.documents) {
        const checkedAttributesIds = xAxis ? [xAxis.attributeId, y1Axis.attributeId] : [y1Axis.attributeId];
        const containsData = checkedAttributesIds.every(attributeId => !!document.data[attributeId]);
        if (containsData && points[pointIndex]) {
          const point = points[pointIndex];
          point.attrId = y1Axis.attributeId;
          point.traceIx = traceIndex;
          pointIndex++;
        }
      }
      traceIndex++;
    }
    const y2Axis = this.config.axes[ChartAxisType.Y2];
    if (y2Axis) {
      for (const document of this.documents) {
        const checkedAttributesIds = xAxis ? [xAxis.attributeId, y2Axis.attributeId] : [y2Axis.attributeId];
        const containsData = checkedAttributesIds.every(attributeId => !!document.data[attributeId]);
        if (containsData && points[pointIndex]) {
          const point = points[pointIndex];
          point.attrId = y2Axis.attributeId;
          point.traceIx = traceIndex;
          pointIndex++;
        }
      }
    }
  }

}
