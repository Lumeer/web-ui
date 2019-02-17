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

import {Config, Data, Layout, newPlot, Plots, purge, react, redraw, relayout} from 'plotly.js';
import {ChartData} from '../data/convertor/chart-data';
import {ChartType} from '../../../../core/store/charts/chart';
import {DataChange, PlotMaker, ValueChange} from './plot-maker/plot-maker';
import {LinePlotMaker} from './plot-maker/line-plot-maker';
import {BarPlotMaker} from './plot-maker/bar-plot-maker';
import {PiePlotMaker} from './plot-maker/pie-plot-maker';
import {DraggablePlotMaker} from './plot-maker/draggable-plot-maker';

export class ChartVisualizer {
  private currentType: ChartType;

  private data: Data[] = [];

  private layout: Partial<Layout>;

  private config: Partial<Config> = this.createConfig();

  private revision = 1;

  private plotMaker: PlotMaker;

  private writable: boolean;

  constructor(private chartElement: ElementRef, private onValueChanged: (valueChange: ValueChange) => void) {}

  public createChart(data: ChartData) {
    this.createOrRefreshData(data);
    this.currentType = data.type;
    newPlot(this.chartElement.nativeElement, this.data, this.layout, this.config).then(() => this.refreshDrag());
    this.chartElement.nativeElement.on(
      'plotly_relayout',
      () => this.plotMaker instanceof DraggablePlotMaker && (this.plotMaker as DraggablePlotMaker).onRelayout()
    );
  }

  public refreshChart(data: ChartData) {
    this.createOrRefreshData(data);
    this.currentType = data.type;
    react(this.chartElement.nativeElement, this.data, this.layout).then(() => this.refreshDrag());
  }

  public destroyChart() {
    purge(this.chartElement.nativeElement);
  }

  private createOrRefreshData(data: ChartData) {
    const shouldRefreshPlotMaker = this.shouldRefreshPlotMaker(data);
    if (shouldRefreshPlotMaker) {
      this.plotMaker = this.createPlotMakerByType(data.type, this.chartElement);
      this.plotMaker.setOnDataChanged(change => this.onDataChanged(change));
      this.plotMaker.setOnValueChanged(this.onValueChanged);
    }

    this.plotMaker.updateData(data);
    this.layout = this.plotMaker.createLayout();
    this.data = this.plotMaker.createData();

    this.incRevisionNumber();
  }

  private shouldRefreshPlotMaker(data: ChartData): boolean {
    return !this.currentType || this.currentType !== data.type;
  }

  public onDataChanged(change: DataChange) {
    this.data[change.trace][change.axis][change.index] = change.value;
    this.incRevisionNumber();
    react(this.chartElement.nativeElement, this.data, this.layout).then(() => this.refreshDrag());
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

  public setWriteEnabled(enabled: boolean) {
    this.writable = enabled;
  }

  private refreshDrag() {
    if (!(this.plotMaker instanceof DraggablePlotMaker)) {
      return;
    }

    const draggablePlotMaker = this.plotMaker as DraggablePlotMaker;
    draggablePlotMaker.setDragEnabled(this.writable);

    if (this.writable) {
      draggablePlotMaker.initDrag();
    } else {
      draggablePlotMaker.destroyDrag();
    }
  }

  private incRevisionNumber() {
    this.layout['datarevision'] = this.revision++;
  }

  private createConfig(): Partial<Config> {
    return {responsive: true};
  }

  public resize() {
    Plots.resize(this.chartElement.nativeElement);
  }
}
