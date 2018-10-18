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
import {ChartAxisModel, ChartType} from '../../../../../core/store/chart/chart.model';
import {Data, Layout} from 'plotly.js';

export class LinePlotMaker extends PlotMaker {

  public createData(): Data[] {
    const dataStyle = this.getDataStyle();

    const data: Data[] = [];

    if (this.config.xAxis || this.config.y1Axis) {
      data.push(this.createAxesData(dataStyle, this.config.xAxis, this.config.y1Axis));
    }

    if (this.config.xAxis && this.config.y2Axis) {
      const y2DataStyle = {...dataStyle, yaxis: 'y2'};
      data.push(this.createAxesData(y2DataStyle, this.config.xAxis, this.config.y2Axis));
    }

    return data;
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

    if (xAxis) {
      data['x'] = traceX;
    }

    if (yAxis) {
      data['y'] = traceY;
    }

    return data;
  }

  public createLayout(): Partial<Layout> {
    if (this.config.y2Axis) {
      return {
        yaxis2: {
          overlaying: 'y',
          side: 'right'
        }
      };
    }
    return {};
  }

  public getType(): ChartType {
    return ChartType.Line;
  }

}
