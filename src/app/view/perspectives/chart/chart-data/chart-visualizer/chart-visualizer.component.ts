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
  Output,
  EventEmitter,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {ChartData} from '../convertor/chart-data';
import {ChartVisualizer} from '../../visualizer/chart-visualizer';
import {ValueChange} from '../../visualizer/plot-maker/plot-maker';
import {Subject, Subscription} from 'rxjs';

@Component({
  selector: 'chart-visualizer',
  templateUrl: './chart-visualizer.component.html',
  styleUrls: ['./chart-visualizer.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartVisualizerComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public chartData: ChartData;

  @Input()
  public resize: Subject<void>;

  @Output()
  public change = new EventEmitter<ValueChange>();

  @ViewChild('chart')
  private chartElement: ElementRef;

  private subscriptions = new Subscription();
  private chartVisualizer: ChartVisualizer;

  public ngOnInit() {
    if (this.resize) {
      this.subscriptions.add(this.resize.subscribe(() => this.chartVisualizer && this.chartVisualizer.resize()));
    }
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.chartData && this.chartData) {
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

  private refreshChart() {
    this.chartVisualizer.setWriteEnabled(this.isWritable());
    this.chartVisualizer.refreshChart(this.chartData);
  }

  private createChart() {
    const onValueChange = valueChange => this.change.next(valueChange);
    this.chartVisualizer = new ChartVisualizer(this.chartElement, onValueChange);
    this.chartVisualizer.setWriteEnabled(this.isWritable());
    this.chartVisualizer.createChart(this.chartData);
  }

  private isWritable(): boolean {
    return this.chartData ? this.chartData.sets.some(set => set.draggable) : false;
  }

  public ngOnDestroy() {
    this.chartVisualizer.destroyChart();
    this.subscriptions.unsubscribe();
  }
}
