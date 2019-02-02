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
import {ChartDataSet, ChartYAxisType} from '../../chart-data/convertor/chart-data';
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {AxisDraggablePlotMaker, PointData} from './axis-draggable-plot-maker';
import * as d3 from 'd3';
import {isNotNullOrUndefind} from '../../../../../shared/utils/common.utils';

export class BarPlotMaker extends AxisDraggablePlotMaker {
  public createData(): Data[] {
    const y1Sets = this.chartData.sets.filter(set => set.yAxisType === ChartAxisType.Y1);
    const y2Sets = this.chartData.sets.filter(set => set.yAxisType === ChartAxisType.Y2);

    const helperData: {y1: Data[]; y2: Data[]} = this.createHelperData(y1Sets, y2Sets);

    const y1Data = y1Sets.map(set => this.createAxisData(set));
    const y2Data = y2Sets.map(set => this.createAxisData(set));

    return [...y1Data, ...helperData.y1, ...helperData.y2, ...y2Data];
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

    const isYCategory = this.isAxisCategory(set.yAxisType);
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

    return data;
  }

  private axis1DataStyle(set: ChartDataSet): Data {
    return this.getDefaultDataStyle(set.color, ChartAxisType.Y1);
  }

  private axis2DataStyle(set: ChartDataSet): Data {
    return {...this.getDefaultDataStyle(set.color, ChartAxisType.Y2), yaxis: 'y2'};
  }

  private getDefaultDataStyle(color: string, type: ChartYAxisType): Data {
    let trace = {};
    if (type === ChartAxisType.Y1) {
      trace = {marker: {color}};
    } else {
      trace = {marker: {color: '#00000000', line: {color, width: 2}}};
    }

    trace['type'] = 'bar';

    return trace;
  }

  private createHelperData(y1Sets: ChartDataSet[], y2Sets: ChartDataSet[]): {y1: Data[]; y2: Data[]} {
    const y1Point = this.firstNonNullValue(y1Sets);
    const y2Point = this.firstNonNullValue(y2Sets);
    if (!y1Point || !y2Point) {
      return {y1: [], y2: []};
    }

    const y1HelperData = y2Sets.map(() => this.createHelperDataForPoint(y1Point.x, y1Point.y));
    const y2HelperData = y1Sets.map(() => this.createHelperDataForPoint(y2Point.x, y2Point.y, 'y2'));

    return {y1: y1HelperData, y2: y2HelperData};
  }

  private firstNonNullValue(sets: ChartDataSet[]): {x: any; y: any} {
    for (const set of sets) {
      const point = set.points.find(p => isNotNullOrUndefind(p.x) && isNotNullOrUndefind(p.y));
      if (point) {
        return {x: point.x, y: point.y};
      }
    }
    return null;
  }

  private createHelperDataForPoint(x: any, y: any, yaxis?: string): Data {
    const data = {x: [x], y: [y], marker: {color: '#00000000'}};
    data['hoverinfo'] = 'none';
    data['type'] = 'bar';
    data['showlegend'] = false;

    return {...data, yaxis};
  }

  public createLayout(): Partial<Layout> {
    return {...this.yAxis1Layout(), ...this.yAxis2Layout(), ...this.otherLayout()};
  }

  private otherLayout(): Partial<Layout> {
    return {
      barmode: 'group',
      legend: {
        xanchor: 'left',
        x: 1.1,
      },
    };
  }

  public getPointPosition(point: any, datum: any): {x: number; y: number} {
    return {x: datum.x, y: point.clickedY};
  }

  public getTraceIndexForPoint(point: any): number {
    const barsContainers = d3.selectAll('.barlayer .trace .points')[0];
    const pointNode = d3.select(point).node().parentNode;

    for (let i = 0; i < barsContainers.length; i++) {
      const children = (barsContainers[i] as Element).children;

      if (Array.from(children).find(p => p === pointNode)) {
        return i;
      }
    }

    return 0;
  }

  public getPointNewY(point: any, datum: any, event: any): number {
    const pointData: PointData = point.pointData;
    const computedY = event.sourceEvent.pageY - pointData.offset.top + datum.ct[1];
    const dy = computedY - pointData.clickedY;
    return pointData.initialY + dy;
  }

  public getPoints(): d3.Selection<any> {
    return d3.selectAll('.barlayer .trace .points .point path');
  }
}
