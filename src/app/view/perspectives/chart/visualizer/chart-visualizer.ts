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
import {DataChange, PlotMaker} from './plot-maker/plot-maker';
import {createPlotMakerByType} from './plot-maker/plot-maker-util';
import {DraggablePlotMaker} from './plot-maker/draggable-plot-maker';

export class ChartVisualizer {
  private data: Data[] = [];

  private layout: Partial<Layout>;

  private config: Partial<Config> = this.createConfig();

  private plotMaker: PlotMaker;

  constructor(
    private chartElement: ElementRef,
    private writable: boolean,
    private onValueChanged?: (documentId: string, attributeId: string, value: string) => void
  ) {}

  public setData(collections: CollectionModel[], documents: DocumentModel[], config: ChartConfig) {
    const shouldRefreshPlotMaker = this.shouldRefreshPlotMaker(config);
    if (shouldRefreshPlotMaker) {
      this.plotMaker = createPlotMakerByType(config.type, this.chartElement);
      this.plotMaker.setOnValueChanged(
        change => this.onValueChanged && this.onValueChanged(change.documentId, change.attributeId, change.value)
      );
      this.plotMaker.setOnDataChanged(change => this.onDataChanged(change));
    }

    const currentConfig = this.plotMaker.currentConfig();

    this.plotMaker.updateData(collections, documents, config);
    this.data = this.plotMaker.createData();

    if (shouldRefreshPlotMaker || this.shouldRefreshLayout(config, currentConfig)) {
      this.layout = this.plotMaker.createLayout();
    }
    this.incRevisionNumber();
  }

  private shouldRefreshPlotMaker(config: ChartConfig) {
    return !this.plotMaker || this.plotMaker.currentType() !== config.type;
  }

  private shouldRefreshLayout(newConfig: ChartConfig, currentConfig: ChartConfig) {
    return !this.plotMaker || !currentConfig || JSON.stringify(newConfig) !== JSON.stringify(currentConfig);
  }

  public onDataChanged(change: DataChange) {
    this.data[change.trace][change.axis][change.index] = change.value;
    this.incRevisionNumber();
    this.refreshChart();
  }

  private incRevisionNumber() {
    const rev = this.layout['datarevision'];
    this.layout['datarevision'] = rev ? rev + 1 : 1;
  }

  private createConfig(): Partial<Config> {
    const config = {};
    config['responsive'] = true;
    return config;
  }

  public createChartAndVisualize() {
    this.createNewChart();
    this.refreshDrag();
    this.chartElement.nativeElement.on(
      'plotly_relayout',
      () => this.plotMaker instanceof DraggablePlotMaker && (this.plotMaker as DraggablePlotMaker).onRelayout()
    );
  }

  public visualize() {
    this.refreshChart();
    this.refreshDrag();
  }

  private createNewChart() {
    newPlot(this.chartElement.nativeElement, this.data, this.layout, this.config);
  }

  private refreshChart() {
    react(this.chartElement.nativeElement, this.data, this.layout);
  }

  private refreshDrag() {
    if (this.writable) {
      this.plotMaker instanceof DraggablePlotMaker && (this.plotMaker as DraggablePlotMaker).initDrag();
    } else {
      this.plotMaker instanceof DraggablePlotMaker && (this.plotMaker as DraggablePlotMaker).destroyDrag();
    }
  }

  public enableWrite() {
    this.writable = true;
    this.plotMaker &&
      this.plotMaker instanceof DraggablePlotMaker &&
      (this.plotMaker as DraggablePlotMaker).setDragEnabled(true);
  }

  public disableWrite() {
    this.writable = false;
    this.plotMaker &&
      this.plotMaker instanceof DraggablePlotMaker &&
      (this.plotMaker as DraggablePlotMaker).setDragEnabled(false);
  }
}
