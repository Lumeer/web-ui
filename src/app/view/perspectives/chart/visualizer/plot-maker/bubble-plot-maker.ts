/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {Data, Layout, d3} from 'plotly.js';
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {ChartDataSet, ChartPoint} from '../../data/convertor/chart-data';
import {TwoDAxisPlotMaker} from './two-d-axis-plot-maker';
import {isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';
import {PlotlyChartData} from './plot-maker';

const MIN_POINT_SIZE = 20;
const MAX_POINT_SIZE = 60;

export class BubblePlotMaker extends TwoDAxisPlotMaker {
  public createData(): PlotlyChartData[] {
    return this.chartData.sets.map(set => this.createAxisData(set));
  }

  private createAxisData(set: ChartDataSet): PlotlyChartData {
    const traceX = [];
    const traceY = [];
    const colors = [];
    const texts = [];
    const sizes = [];

    const sizeScale = this.pointSizeScale(set.points);

    set.points.forEach(point => {
      traceX.push(point.x);
      traceY.push(point.y);
      colors.push(point.color);
      texts.push(point.title);
      sizes.push(sizeScale(point.size));
    });

    let data: Data;
    if (set.yAxisType === ChartAxisType.Y1) {
      data = this.axis1DataStyle(set);
      data.marker.color = colors;
    } else {
      data = this.axis2DataStyle(set);
    }

    set.name && (data.name = set.name);
    data.x = traceX;
    data.y = traceY;
    data.text = texts;
    data.textinfo = 'text';
    data.hoverinfo = 'x+text';
    data.marker.size = sizes;

    return data;
  }

  private pointSizeScale(points: ChartPoint[]): (value: number) => number {
    const {minimum, maximum} = points.reduce(
      (val, p) => ({
        maximum: Math.max(val.maximum, p.size || 0),
        minimum: Math.min(val.minimum, isNotNullOrUndefined(p.size) ? p.size : Number.MAX_SAFE_INTEGER),
      }),
      {minimum: Number.MAX_SAFE_INTEGER, maximum: 0}
    );

    const range = MAX_POINT_SIZE - MIN_POINT_SIZE;

    if (minimum >= maximum) {
      return () => range / 2 + MIN_POINT_SIZE;
    }

    return d3.scale.linear().domain([minimum, maximum]).range([MIN_POINT_SIZE, MAX_POINT_SIZE]);
  }

  private axis1DataStyle(set: ChartDataSet): PlotlyChartData {
    return this.getDefaultDataStyle(set);
  }

  private axis2DataStyle(set: ChartDataSet): PlotlyChartData {
    return {
      ...this.getDefaultDataStyle(set),
      yaxis: 'y2',
      marker: {color: '#00000000', line: {color: set.color, width: 4}},
    };
  }

  private getDefaultDataStyle(set: ChartDataSet): PlotlyChartData {
    return {
      mode: 'markers' as const,
      type: 'scatter' as const,
      marker: {color: set.color},
    };
  }

  public createLayout(): Partial<Layout> {
    return {...this.xAxisLayout(), ...this.yAxis1Layout(), ...this.yAxis2Layout(), ...this.otherLayout()};
  }

  private otherLayout(): Partial<Layout> {
    return {
      legend: {
        xanchor: 'left',
        x: 1.1,
      },
    };
  }

  public getPoints(): any {
    return d3.selectAll('.scatterlayer .trace .points path');
  }
}
