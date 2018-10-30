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

import {ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';

import {ChartConfig} from '../../../../core/store/charts/chart.model';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {ChartVisualizer} from '../visualizer/chart-visualizer';
import {AppState} from '../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {DocumentsAction} from '../../../../core/store/documents/documents.action';

@Component({
  selector: 'chart-visualization',
  templateUrl: './chart-visualization.component.html',
  styleUrls: ['./chart-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartVisualizationComponent implements OnChanges {

  @Input()
  public collection: CollectionModel;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: ChartConfig;

  @ViewChild('chart')
  private chartElement: ElementRef;

  private chartVisualizer: ChartVisualizer;

  public constructor(private store$: Store<AppState>) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.documents || changes.config && this.config) {
      this.visualize();
    }
  }

  private visualize() {
    if (this.chartVisualizer) {
      this.refreshChart();
    } else {
      this.createChart();
    }
  }

  private createChart() {
    const onValueChange = (documentId, attributeId, value) => this.onValueChanged(documentId, attributeId, value);
    this.chartVisualizer = new ChartVisualizer(this.chartElement, onValueChange);
    this.setChartData();
    this.chartVisualizer.createChartAndVisualize();
  }

  private refreshChart() {
    this.setChartData();
    this.chartVisualizer.visualize();
  }

  private setChartData() {
    this.chartVisualizer.setData([this.collection], this.documents, this.config);
  }

  private onValueChanged(documentId: string, attributeId: string, value: string) {
    const changedDocument = this.documents.find(document => document.id === documentId);
    if (!changedDocument) {
      return;
    }

    const patchDocument = {...changedDocument, data: {[attributeId]: value}};
    this.store$.dispatch(new DocumentsAction.PatchData({document: patchDocument}));
  }

}
