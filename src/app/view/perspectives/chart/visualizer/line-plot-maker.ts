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

import {Data, Layout} from 'plotly.js';
import {PlotMaker} from './plot-maker';
import {ChartData, ChartDataSet} from '../chart-data/convertor/chart-data';
import {ChartAxisType} from '../../../../core/store/charts/chart';

export class LinePlotMaker extends PlotMaker {
  public createData(chartData: ChartData): Data[] {
    return chartData.sets.map(set => this.createAxisData(set));
  }

  private createAxisData(set: ChartDataSet): Data {
    let data: Data = {};
    if (set.yAxisType === ChartAxisType.Y1) {
      data = this.axis1DataStyle(set);
    } else {
      data = this.axis2DataStyle(set);
    }

    const traceX = [];
    const traceY = [];

    set.points.forEach(point => {
      traceX.push(point.x);
      traceY.push(point.y);
    });

    set.name && (data['name'] = set.name);
    data['x'] = traceX;
    data['y'] = traceY;

    return data;
  }

  private axis1DataStyle(set: ChartDataSet): Data {
    return this.getDefaultDataStyle(set);
  }

  private axis2DataStyle(set: ChartDataSet): Data {
    return {
      ...this.getDefaultDataStyle(set),
      yaxis: 'y2',
      line: {
        dash: 'dot',
        width: 4,
      },
    };
  }

  private getDefaultDataStyle(set: ChartDataSet): Data {
    const trace = {
      marker: {color: set.color, size: 10},
      line: {color: set.color},
    };
    trace['mode'] = 'lines+markers';
    trace['type'] = 'scatter';

    return trace;
  }

  public createLayout(chartData: ChartData): Partial<Layout> {
    return {...this.yAxis1Layout(chartData), ...this.yAxis2Layout(chartData), ...this.otherLayout()};
  }

  private yAxis1Layout(chartData: ChartData): Partial<Layout> {
    return {};
  }

  private yAxis2Layout(chartData: ChartData): Partial<Layout> {
    const containsY2Data = !!chartData.sets.find(data => data.yAxisType === ChartAxisType.Y2);
    if (containsY2Data) {
      return {
        yaxis2: {
          overlaying: 'y',
          side: 'right',
        },
      };
    }
    return {};
  }

  private otherLayout(): Partial<Layout> {
    return {
      legend: {
        xanchor: 'left',
        x: 1.1,
      },
    };
  }
}
