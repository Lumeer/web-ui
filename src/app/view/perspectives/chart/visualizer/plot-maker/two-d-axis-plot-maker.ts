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

import {Layout} from 'plotly.js';
import {PlotMaker} from './plot-maker';

export abstract class TwoDAxisPlotMaker extends PlotMaker {

  public abstract getPoints(): any;

  protected xAxisLayout(): Partial<Layout> {
    const layout: Partial<Layout> = {};
    const data = this.chartData.xAxisData;
    if (data) {
      layout.xaxis = {};
      if (data.formatter) {
        layout.xaxis.tickformat = 'xFormatter';
      }
      if (data.ticks?.length) {
        layout.xaxis.type = 'category';
        layout.xaxis.tickmode = 'array';
        layout.xaxis.tickvals = data.ticks.map(t => t.value);
        layout.xaxis.ticktext = data.ticks.map(t => t.title);
      }
    }

    return layout;
  }

  protected yAxis1Layout(): Partial<Layout> {
    const data = this.chartData.y1AxisData;
    const layout: Partial<Layout> = {};
    if (data) {
      layout.yaxis = {};
      if (data.range) {
        layout.yaxis.range = data.range;
      }
      if (data.formatter) {
        layout.yaxis.tickformat = 'y1Formatter';
      }
      if (data.ticks?.length) {
        layout.yaxis.type = 'category';
        layout.yaxis.tickmode = 'array';
        layout.yaxis.tickvals = data.ticks.map(t => t.value);
        layout.yaxis.ticktext = data.ticks.map(t => t.title);
      }
    }

    return layout;
  }

  protected yAxis2Layout(): Partial<Layout> {
    const data = this.chartData.y2AxisData;
    const layout: Partial<Layout> = {};
    if (data) {
      layout.yaxis2 = {overlaying: 'y', side: 'right'};
      if (data.range) {
        layout.yaxis2.range = data.range;
      }
      if (data.formatter) {
        layout.yaxis2.tickformat = 'y2Formatter';
      }
      if (data.ticks?.length) {
        layout.yaxis2.type = 'category';
        layout.yaxis2.tickmode = 'array';
        layout.yaxis2.tickvals = data.ticks.map(t => t.value);
        layout.yaxis2.ticktext = data.ticks.map(t => t.title);
      }
    }
    return layout;
  }

  public initDoubleClick() {
    this.getPoints().on('dblclick', (event, index) => {
      const dataSetIndex = this.getDataSetByGlobalIndex(index);
      const dataSet = this.chartData.sets[dataSetIndex];
      const point = dataSet.points[event.i];
      this.onDoubleClick({setId: dataSet.id, pointId: point.id, resourceType: dataSet.resourceType});
    });
  }

  private getDataSetByGlobalIndex(index: number): number {
    let upperIndex = 0;
    for (let i = 0; i < this.chartData.sets.length; i++) {
      const pointsLength = (this.chartData.sets[i].points || []).length;
      upperIndex += pointsLength;
      if (index < upperIndex) {
        return i;
      }
    }

    return 0;
  }

}
