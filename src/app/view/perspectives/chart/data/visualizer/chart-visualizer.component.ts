/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  Output,
  EventEmitter,
  OnDestroy, OnInit,
} from '@angular/core';
import {ChartVisualizer} from '../../visualizer/chart-visualizer';
import * as PlotlyJS from 'plotly.js';
import * as CSLocale from 'plotly.js/lib/locales/cs.js';
import {ClickEvent, ValueChange} from '../../visualizer/plot-maker/plot-maker';
import {ChartData} from '../convertor/chart-data';

@Component({
  selector: 'chart-visualizer',
  templateUrl: './chart-visualizer.component.html',
  styleUrls: ['./chart-visualizer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartVisualizerComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public chartData: ChartData;

  @Output()
  public change = new EventEmitter<ValueChange>();

  @Output()
  public doubleClick = new EventEmitter<ClickEvent>();

  @ViewChild('chart', {static: true})
  private chartElement: ElementRef;

  private chartVisualizer: ChartVisualizer;

  public ngOnInit() {
    (PlotlyJS as any).register(CSLocale);
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
    const onValueChange = valueChange => this.change.emit(valueChange);
    const onDoubleClick = event => this.doubleClick.emit(event);
    this.chartVisualizer = new ChartVisualizer(this.chartElement, onValueChange, onDoubleClick);
    this.chartVisualizer.setWriteEnabled(this.isWritable());
    this.chartVisualizer.createChart(this.chartData);
  }

  private isWritable(): boolean {
    return this.chartData ? this.chartData.sets.some(set => set.draggable) : false;
  }

  public ngOnDestroy() {
    this.chartVisualizer?.destroyChart();
  }

  public resize() {
    this.chartVisualizer?.resize();
  }
}
