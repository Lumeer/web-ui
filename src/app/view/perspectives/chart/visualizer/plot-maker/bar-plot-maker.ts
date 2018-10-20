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
import {ChartAxisModel, ChartAxisType, ChartType} from '../../../../../core/store/chart/chart.model';
import {Data, Layout} from 'plotly.js';
import {hex2rgba} from '../../../../../shared/util';

export class BarPlotMaker extends PlotMaker {

  public createData(): Data[] {
    const data: Data[] = [];

    if (this.config.xAxis && this.config.y1Axis && this.config.y2Axis) {
      data.push(this.createAxis1Data(this.config.xAxis, this.config.y1Axis));
      // workaround data to group columns with multiple values
      data.push(...this.createHelperData());
      data.push(this.createAxis2Data(this.config.xAxis, this.config.y2Axis));
    } else if (this.config.xAxis || this.config.y2Axis) {
      data.push(this.createAxis2Data(this.config.xAxis, this.config.y2Axis));
    } else if (this.config.xAxis || this.config.y1Axis) {
      data.push(this.createAxis1Data(this.config.xAxis, this.config.y1Axis));
    }

    return data;
  }

  private createHelperData(): any[] {
    const names = this.findAxesNonNullAttributeValues(this.config.xAxis.attributeId, this.config.y1Axis.attributeId, this.config.y2Axis.attributeId);
    if (names.length < 2) {
      return [];
    }

    const dataY = {x: [names[0]], y: [0], showlegend: false, type: 'bar', hoverinfo: 'none'};
    const dataY2 = {x: [names[1]], y: [0], yaxis: 'y2', showlegend: false, type: 'bar', hoverinfo: 'none'};
    return [dataY, dataY2];
  }

  private findAxesNonNullAttributeValues(xAttrId: string, y1AttrId: string, y2AttrId): string[] {
    let yValue: string = null;
    let y2Value: string = null;
    for (const document of this.documents) {
      if (!yValue && document.data[xAttrId] && document.data[y1AttrId]) {
        yValue = document.data[xAttrId];
      }

      if (!y2Value && document.data[xAttrId] && document.data[y2AttrId]) {
        y2Value = document.data[xAttrId];
      }

      if (yValue && y2Value) {
        break;
      }

    }
    return [yValue, y2Value].filter(val => !!val);
  }

  private createAxis1Data(xAxis?: ChartAxisModel, yAxis?: ChartAxisModel): Data {
    const dataStyle = this.getDataStyle(ChartAxisType.Y1);
    return this.createAxesData(dataStyle, xAxis, yAxis);
  }

  private createAxis2Data(xAxis?: ChartAxisModel, yAxis?: ChartAxisModel): Data {
    const dataStyle = this.getDataStyle(ChartAxisType.Y2);
    const data = this.createAxesData(dataStyle, xAxis, yAxis);
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
    if (this.config.y2Axis) {
      return {
        barmode: 'group',
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
    return ChartType.Bar;
  }

}
