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

import {ElementRef} from '@angular/core';

import {Config, Data, Layout, newPlot, react} from 'plotly.js';
import {ChartData} from '../chart-data/convertor/chart-data';
import {ChartType} from '../../../../core/store/charts/chart';
import {PlotMaker} from './plot-maker/plot-maker';
import {LinePlotMaker} from './plot-maker/line-plot-maker';
import {BarPlotMaker} from './plot-maker/bar-plot-maker';
import {PiePlotMaker} from './plot-maker/pie-plot-maker';
import {DataChange} from '../visualizer2/plot-maker/plot-maker2';
import {DraggablePlotMaker} from './plot-maker/draggable-plot-maker';

export class ChartVisualizer {
  private currentData: ChartData;

  private data: Data[] = [];

  private layout: Partial<Layout>;

  private config: Partial<Config> = this.createConfig();

  private revision = 1;

  private plotMaker: PlotMaker;

  constructor(private chartElement: ElementRef, private writable: boolean) {}

  public createChart(data: ChartData) {
    this.createOrRefreshData(data);
    this.currentData = data;
    react(this.chartElement.nativeElement, this.data, this.layout);
    this.refreshDrag();
    this.chartElement.nativeElement.on(
      'plotly_relayout',
      () => this.plotMaker instanceof DraggablePlotMaker && (this.plotMaker as DraggablePlotMaker).onRelayout()
    );
  }

  public refreshChart(data: ChartData) {
    this.createOrRefreshData(data);
    this.currentData = data;
    newPlot(this.chartElement.nativeElement, this.data, this.layout, this.config);
    this.refreshDrag();
  }

  private createOrRefreshData(data: ChartData) {
    const shouldRefreshPlotMaker = this.shouldRefreshPlotMaker(data);
    if (shouldRefreshPlotMaker) {
      this.plotMaker = this.createPlotMakerByType(data.type, this.chartElement);
      this.plotMaker.setOnDataChanged(change => this.onDataChanged(change));
    }

    this.plotMaker.updateData(data);
    this.layout = this.plotMaker.createLayout();
    this.data = this.plotMaker.createData();

    this.incRevisionNumber();
  }

  private shouldRefreshPlotMaker(data: ChartData): boolean {
    return !this.currentData || this.currentData.type !== data.type;
  }

  public onDataChanged(change: DataChange) {
    this.data[change.trace][change.axis][change.index] = change.value;
    this.incRevisionNumber();
    react(this.chartElement.nativeElement, this.data, this.layout);
    this.refreshDrag();
  }

  private createPlotMakerByType(type: ChartType, element: ElementRef): PlotMaker {
    switch (type) {
      case ChartType.Line:
        return new LinePlotMaker(element);
      case ChartType.Bar:
        return new BarPlotMaker(element);
      case ChartType.Pie:
        return new PiePlotMaker(element);
    }
  }

  public enableWrite() {
    this.setWriteEnabled(true);
  }

  public disableWrite() {
    this.setWriteEnabled(false);
  }

  private setWriteEnabled(enabled: boolean) {
    this.writable = enabled;
    this.plotMaker &&
      this.plotMaker instanceof DraggablePlotMaker &&
      (this.plotMaker as DraggablePlotMaker).setDragEnabled(enabled);
  }

  private refreshDrag() {
    if (this.writable) {
      this.plotMaker instanceof DraggablePlotMaker && (this.plotMaker as DraggablePlotMaker).initDrag();
    } else {
      this.plotMaker instanceof DraggablePlotMaker && (this.plotMaker as DraggablePlotMaker).destroyDrag();
    }
  }

  private incRevisionNumber() {
    this.layout['datarevision'] = this.revision++;
  }

  private createConfig(): Partial<Config> {
    return {responsive: true};
  }
}
