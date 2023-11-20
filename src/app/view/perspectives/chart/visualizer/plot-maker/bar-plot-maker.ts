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

import {Layout, d3} from 'plotly.js';
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {AxisDraggablePlotMaker, PointData} from './axis-draggable-plot-maker';
import {ChartAxisData, ChartDataSet, ChartYAxisType} from '../../data/convertor/chart-data';
import {PlotlyChartData} from './plot-maker';
import {isNotNullOrUndefined} from '@lumeer/utils';

export class BarPlotMaker extends AxisDraggablePlotMaker {
  public createData(): PlotlyChartData[] {
    const y1Sets = this.chartData.sets.filter(set => set.yAxisType === ChartAxisType.Y1);
    const y2Sets = this.chartData.sets.filter(set => set.yAxisType === ChartAxisType.Y2);

    const helperData: {y1: PlotlyChartData[]; y2: PlotlyChartData[]} = this.createHelperData(
      this.chartData.y1AxisData,
      y1Sets,
      this.chartData.y2AxisData,
      y2Sets
    );

    const y1Data = y1Sets.map(set => this.createAxisData(set));
    const y2Data = y2Sets.map(set => this.createAxisData(set));

    return [...y1Data, ...helperData.y1, ...helperData.y2, ...y2Data];
  }

  private createAxisData(set: ChartDataSet): PlotlyChartData {
    const traceX = [];
    const traceY = [];
    const colors = [];
    const texts = [];

    let data: PlotlyChartData;
    set.points.forEach(point => {
      traceX.push(point.x);
      traceY.push(point.y);
      colors.push(point.color);
      texts.push(point.title);
    });

    if (set.yAxisType === ChartAxisType.Y1) {
      data = this.axis1DataStyle(set);
      data.marker.color = colors;
    } else {
      data = this.axis2DataStyle(set);
      data.marker.line.color = colors;
    }

    set.name && (data['name'] = set.name);
    data.x = traceX;
    data.y = traceY;
    data.text = texts;

    data.textinfo = 'text';
    data.hoverinfo = 'x+text';

    return data;
  }

  private axis1DataStyle(set: ChartDataSet): PlotlyChartData {
    return this.getDefaultDataStyle(set.color, ChartAxisType.Y1);
  }

  private axis2DataStyle(set: ChartDataSet): PlotlyChartData {
    return {...this.getDefaultDataStyle(set.color, ChartAxisType.Y2), yaxis: 'y2'};
  }

  private getDefaultDataStyle(color: string, type: ChartYAxisType): PlotlyChartData {
    if (type === ChartAxisType.Y1) {
      return {type: 'bar' as const, marker: {color}};
    } else {
      return {marker: {color: '#00000000', line: {width: 2, color}}, type: 'bar' as const};
    }
  }

  private createHelperData(
    y1Axis: ChartAxisData,
    y1Sets: ChartDataSet[],
    y2Axis: ChartAxisData,
    y2Sets: ChartDataSet[]
  ): {y1: PlotlyChartData[]; y2: PlotlyChartData[]} {
    const y1Point = this.firstNonNullValue(y1Axis, y1Sets);
    const y2Point = this.firstNonNullValue(y2Axis, y2Sets);
    if (!y1Point || !y2Point) {
      return {y1: [], y2: []};
    }

    const y1HelperData = y2Sets.map(() => this.createHelperDataForPoint(y1Point.x, y1Point.y));
    const y2HelperData = y1Sets.map(() => this.createHelperDataForPoint(y2Point.x, y2Point.y, 'y2'));

    return {y1: y1HelperData, y2: y2HelperData};
  }

  private firstNonNullValue(axis: ChartAxisData, sets: ChartDataSet[]): {x: any; y: any} {
    for (const set of sets) {
      const point = set.points.find(p => isNotNullOrUndefined(p.x) && isNotNullOrUndefined(p.y));
      if (point) {
        if (this.isNumericType(axis?.constraintType)) {
          return {x: point.x, y: 0};
        }
        return {x: point.x, y: point.y};
      }
    }
    return null;
  }

  private createHelperDataForPoint(x: any, y: any, yaxis?: string): PlotlyChartData {
    return {
      x: [x],
      y: [y],
      marker: {color: '#00000000'},
      hoverinfo: 'none' as const,
      type: 'bar' as const,
      showlegend: false,
      yaxis,
    };
  }

  public createLayout(): Partial<Layout> {
    return {...this.xAxisLayout(), ...this.yAxis1Layout(), ...this.yAxis2Layout(), ...this.otherLayout()};
  }

  private otherLayout(): Partial<Layout> {
    return {
      ...this.legendLayout(),
      barmode: 'group',
    };
  }

  public getPointPosition(point: any, datum: any): {x: number; y: number} {
    return {x: datum.x, y: point.clickedY};
  }

  public getSetIndexForTraceIndex(traceIx: number): number {
    return traceIx % this.chartData.sets.length;
  }

  public getTraceIndexForPoint(point: any): number {
    const barsContainers = d3.selectAll(`.${this.chartId} .barlayer .trace .points`)[0];
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
    const computedY = event.sourceEvent.pageY - pointData.offset.top + pointData.initialY;
    const dy = computedY - pointData.clickedY;
    return pointData.initialY + dy;
  }

  public getPoints(): d3.Selection<any> {
    return d3.selectAll(`.${this.chartId} .barlayer .trace .points .point path`);
  }
}
