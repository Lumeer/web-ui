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

import {AfterViewInit, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import {ChartConfig} from '../../../../core/store/chart/chart.model';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {ChartVisualizer} from '../visualizer/chart-visualizer';

@Component({
  selector: 'chart-visualization',
  templateUrl: './chart-visualization.component.html'
})
export class ChartVisualizationComponent implements OnChanges, AfterViewInit {

  @Input()
  public collection: CollectionModel;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: ChartConfig;

  @ViewChild('chart')
  private chartElement: ElementRef;

  private chartVisualizer: ChartVisualizer;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.documents || changes.config) {
      this.visualize();
    }
  }

  public ngAfterViewInit() {
    this.chartVisualizer = new ChartVisualizer(this.chartElement);
  }

  private visualize() {
    if (this.chartVisualizer) {
      this.chartVisualizer.setData([this.collection], this.documents, this.config);
      this.chartVisualizer.visualize();
    }
  }

}
