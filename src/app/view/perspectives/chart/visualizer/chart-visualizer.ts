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
import {PlotMaker} from './plot-maker';
import {LinePlotMaker} from './line-plot-maker';
import {BarPlotMaker} from './bar-plot-maker';
import {PiePlotMaker} from './pie-plot-maker';

export class ChartVisualizer {
  private currentData: ChartData;

  private data: Data[] = [];

  private layout: Partial<Layout>;

  private config: Partial<Config> = this.createConfig();

  private revision = 1;

  private plotMaker: PlotMaker;

  constructor(private chartElement: ElementRef) {}

  public createChart(data: ChartData) {
    this.createOrRefreshData(data);
    this.currentData = data;
    react(this.chartElement.nativeElement, this.data, this.layout);
  }

  public refreshChart(data: ChartData) {
    this.createOrRefreshData(data);
    this.currentData = data;
    newPlot(this.chartElement.nativeElement, this.data, this.layout, this.config);
  }

  private createOrRefreshData(data: ChartData) {
    const shouldRefreshPlotMaker = this.shouldRefreshPlotMaker(data);
    if (shouldRefreshPlotMaker) {
      this.plotMaker = this.createPlotMakerByType(data.type, this.chartElement);
    }

    this.layout = this.plotMaker.createLayout(data);
    this.data = this.plotMaker.createData(data);

    this.incRevisionNumber();
  }

  private shouldRefreshPlotMaker(data: ChartData): boolean {
    return !this.currentData || this.currentData.type !== data.type;
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

  private incRevisionNumber() {
    this.layout['datarevision'] = this.revision++;
  }

  private createConfig(): Partial<Config> {
    return {responsive: true};
  }
}
