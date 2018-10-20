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

import {DocumentModel} from '../../../../core/store/documents/document.model';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {ElementRef} from '@angular/core';
import {ChartConfig} from '../../../../core/store/chart/chart.model';
import {Config, Data, Layout, newPlot} from 'plotly.js';
import {PlotMaker} from './plot-maker/plot-maker';
import {createPlotMakerByType} from './plot-maker/plot-maker-util';

export class ChartVisualizer {

  private data: Data[] = [];

  private layout: Partial<Layout> = {};

  private config: Partial<Config> = this.createConfig();

  private plotMaker: PlotMaker;

  constructor(private chartElement: ElementRef) {
  }

  public setData(collections: CollectionModel[], documents: DocumentModel[], config: ChartConfig) {
    if (!this.plotMaker || this.plotMaker.getType() !== config.type) {
      this.plotMaker = createPlotMakerByType(config.type);
    }

    this.plotMaker.updateData(collections, documents, config);
    this.data = this.plotMaker.createData();
    this.layout = this.plotMaker.createLayout();
  }

  private createConfig(): Partial<Config> {
    const config = {};
    config['responsive'] = true;
    return config;
  }

  public visualize() {
    const element = this.chartElement.nativeElement;
    newPlot(element, this.data, this.layout, this.config);
  }

}
