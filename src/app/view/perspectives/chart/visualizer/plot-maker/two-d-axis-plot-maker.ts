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

import {Layout, LayoutAxis} from 'plotly.js';
import {PlotMaker} from './plot-maker';
import {ChartAxisData} from '../../data/convertor/chart-data';
import {isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';

export abstract class TwoDAxisPlotMaker extends PlotMaker {
  public abstract getPoints(): any;

  protected xAxisLayout(): Partial<Layout> {
    const layout: Partial<Layout> = {};
    const axis = createAxisLayout(this.chartData.xAxisData, 'xFormatter');
    if (axis) {
      layout.xaxis = axis;
    }

    return layout;
  }

  protected yAxis1Layout(): Partial<Layout> {
    const layout: Partial<Layout> = {};

    const axis = createAxisLayout(this.chartData.y1AxisData, 'y1Formatter');
    if (axis) {
      layout.yaxis = axis;
    }

    return layout;
  }

  protected yAxis2Layout(): Partial<Layout> {
    const layout: Partial<Layout> = {};

    const axis = createAxisLayout(this.chartData.y2AxisData, 'y2Formatter');
    if (axis) {
      layout.yaxis2 = {...axis, overlaying: 'y', side: 'right'};
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

function createAxisLayout(data: ChartAxisData, formatter: string): Partial<LayoutAxis> {
  if (data) {
    const axis: Partial<LayoutAxis> = {};
    if (data.range) {
      axis.range = data.range;
    }
    if (data.formatter) {
      axis.tickformat = formatter;
    }
    if (data.ticks?.length) {
      if (!data.showTicksAsLinear) {
        axis.type = 'category';
        axis.tickmode = 'array';
      }
      axis.tickvals = data.ticks.map(t => t.value);
      axis.ticktext = data.ticks.map(t => t.title);
    }
    return axis;
  }

  return null;
}
