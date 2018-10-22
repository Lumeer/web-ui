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
import {Data, Layout} from 'plotly.js';

export class LinePlotMaker extends PlotMaker {

  public createData(): Data[] {
    const data: Data[] = [];

    const xAxis = this.config.axes[ChartAxisType.X];

    if (xAxis || this.config.axes[ChartAxisType.Y1]) {
      data.push(this.createAxis1Data(xAxis, this.config.axes[ChartAxisType.Y1]));
    }

    if (xAxis && this.config.axes[ChartAxisType.Y2]) {
      data.push(this.createAxis2Data(xAxis, this.config.axes[ChartAxisType.Y2]));
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
      trace['marker'] = {color};
      trace['line'] = {color};
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

  public createLayout(): Partial<Layout> {
    if (this.config.axes[ChartAxisType.Y2]) {
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

  public getType(): ChartType {
    return ChartType.Line;
  }

}
