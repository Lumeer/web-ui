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

import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
} from '@angular/core';
import {ChartData} from '../convertor/chart-data';
import {ChartVisualizer} from '../../visualizer/chart-visualizer';
import {AllowedPermissions} from '../../../../../core/model/allowed-permissions';

@Component({
  selector: 'chart-visualizer',
  templateUrl: './chart-visualizer.component.html',
  styleUrls: ['./chart-visualizer.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartVisualizerComponent implements OnChanges {
  @Input()
  public chartData: ChartData;

  @Input()
  public allowedPermissions: AllowedPermissions;

  @ViewChild('chart')
  private chartElement: ElementRef;

  private chartVisualizer: ChartVisualizer;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.chartData && this.chartData) {
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

  private refreshChart() {
    this.chartVisualizer.refreshChart(this.chartData);
  }

  private createChart() {
    const writable = this.allowedPermissions && this.allowedPermissions.writeWithView;
    this.chartVisualizer = new ChartVisualizer(this.chartElement, writable);
    this.chartVisualizer.createChart(this.chartData);
  }

  private refreshChartPermissions() {
    if (this.allowedPermissions && this.allowedPermissions.writeWithView) {
      this.chartVisualizer && this.chartVisualizer.enableWrite();
    } else {
      this.chartVisualizer && this.chartVisualizer.disableWrite();
    }
  }
}
