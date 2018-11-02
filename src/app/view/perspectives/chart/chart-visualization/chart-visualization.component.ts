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

import {ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, Output, SimpleChanges, ViewChild, ViewEncapsulation} from '@angular/core';

import {ChartConfig} from '../../../../core/store/charts/chart.model';
import {CollectionModel} from '../../../../core/store/collections/collection.model';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {ChartVisualizer} from '../visualizer/chart-visualizer';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';

@Component({
  selector: 'chart-visualization',
  templateUrl: './chart-visualization.component.html',
  styleUrls: ['./chart-visualization.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ChartVisualizationComponent implements OnChanges {

  @Input()
  public collection: CollectionModel;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: ChartConfig;

  @Input()
  public allowedPermissions: AllowedPermissions;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  @ViewChild('chart')
  private chartElement: ElementRef;

  private chartVisualizer: ChartVisualizer;

  constructor(private ngZone: NgZone) {
  }

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.documents || changes.config) && this.config) {
      this.visualize();
    }
    if (changes.allowedPermissions && this.allowedPermissions) {
      this.refreshChartPermissions();
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
    const writable = this.allowedPermissions && this.allowedPermissions.writeWithView;
    this.chartVisualizer = new ChartVisualizer(this.chartElement, writable, onValueChange);
    this.setChartData();
    this.ngZone.runOutsideAngular(() => this.chartVisualizer.createChartAndVisualize());
  }

  private refreshChart() {
    this.setChartData();
    this.ngZone.runOutsideAngular(() => this.chartVisualizer.visualize());
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
    this.patchData.emit(patchDocument);
  }

  private refreshChartPermissions() {
    if (!this.chartVisualizer) {
      return;
    }

    if (this.allowedPermissions && this.allowedPermissions.writeWithView) {
      this.chartVisualizer.enableWrite();
    } else {
      this.chartVisualizer.disableWrite();
    }
  }

}
