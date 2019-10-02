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

import {Data, Layout} from 'plotly.js';
import {ChartDataSet} from '../../data/convertor/chart-data';
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {AxisDraggablePlotMaker} from './axis-draggable-plot-maker';
import * as d3 from 'd3';

export class LinePlotMaker extends AxisDraggablePlotMaker {
  public createData(): Data[] {
    return this.chartData.sets.map(set => this.createAxisData(set));
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

    const isYCategory = this.isAxisCategoryText(set.yAxisType);
    const additionalYValues = [];
    const addedYValues = new Set();

    set.points.forEach(point => {
      traceX.push(point.x);
      traceY.push(point.y);

      // we need to add first and last category value to the values in order to keep them on y axis while drag
      if (point.y && isYCategory && !addedYValues.has(point.y)) {
        const insertIndex = additionalYValues.length === 0 ? 0 : 1;
        additionalYValues[insertIndex] = point.y;
        addedYValues.add(point.y);
      }
    });

    for (let i = 0; i < additionalYValues.length; i++) {
      traceX.push(null);
      traceY.push(additionalYValues[i]);
    }

    set.name && (data['name'] = set.name);
    data['x'] = traceX;
    data['y'] = traceY;
    data['text'] = this.getYTraceTexts(traceY, set.yAxis);
    data['textinfo'] = 'text';
    data['hoverinfo'] = 'x+text';

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

  public getPointNewY(point: any, datum: any, event: any): number {
    return event.y;
  }

  public getPointPosition(point: any, datum: any): {x: number; y: number} {
    const transform = d3.select(point).attr('transform');
    const translate = transform.substring(10, transform.length - 1).split(/[, ]/);
    return {x: +translate[0], y: +translate[1]};
  }

  public getPoints(): any {
    return d3.selectAll('.scatterlayer .trace .points path');
  }

  public getSetIndexForTraceIndex(traceIx: number): number {
    return traceIx;
  }

  public getTraceIndexForPoint(point: any): number {
    const layoutElement = this.getLayoutElement();
    const traceIds = layoutElement._traceUids;
    const traceClasses = (traceIds && traceIds.map(id => layoutElement._traceWord + id)) || [];
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
}
