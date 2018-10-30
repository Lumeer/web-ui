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

import {DocumentModel} from '../../../../core/store/documents/document.model';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {ChartConfig} from '../../../../core/store/charts/chart.model';
import {Config, Data, Layout, newPlot, react} from 'plotly.js';
import {PlotMaker} from './plot-maker/plot-maker';
import {createPlotMakerByType} from './plot-maker/plot-maker-util';

export class ChartVisualizer {

  private data: Data[] = [];

  private layout: Partial<Layout>;

  private config: Partial<Config> = this.createConfig();

  private plotMaker: PlotMaker;

  constructor(private chartElement: ElementRef,
              private onValueChanged?: (documentId: string, attributeId: string, value: string) => void) {
  }

  public setData(collections: CollectionModel[], documents: DocumentModel[], config: ChartConfig) {
    const shouldRefreshPlotMaker = this.shouldRefreshPlotMaker(config);
    if (shouldRefreshPlotMaker) {
      this.plotMaker = createPlotMakerByType(config.type);
      this.plotMaker.setOnValueChanged(this.onValueChanged);
      this.plotMaker.setOnDataChanged((data) => this.onDataChanged(data));
    }

    if (shouldRefreshPlotMaker || this.shouldRefreshLayout(config)) {
      this.layout = this.plotMaker.createLayout(config);
    }

    this.plotMaker.updateData(this.chartElement, collections, documents, config);
    this.data = this.plotMaker.createData();
  }

  private shouldRefreshPlotMaker(config: ChartConfig) {
    return !this.plotMaker || this.plotMaker.currentType() !== config.type;
  }

  private shouldRefreshLayout(config: ChartConfig) {
    return !this.plotMaker || !this.plotMaker.currentConfig()
      || JSON.stringify(config) !== JSON.stringify(this.plotMaker.currentConfig());
  }

  public onDataChanged(data: Data[]) {
    this.data = data;
    this.refreshChart();
  }

  private createConfig(): Partial<Config> {
    const config = {};
    config['responsive'] = true;
    return config;
  }

  public createChartAndVisualize() {
    this.createNewChart();
    this.initDrag();
  }

  public visualize() {
    this.refreshChart();
    this.initDrag();
  }

  private createNewChart() {
    newPlot(this.chartElement.nativeElement, this.data, this.layout, this.config);
  }

  private refreshChart() {
    react(this.chartElement.nativeElement, this.data, this.layout);
  }

  private initDrag() {
    this.plotMaker.initDrag();
  }

}
