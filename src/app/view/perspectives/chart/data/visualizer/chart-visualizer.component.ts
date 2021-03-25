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
  OnDestroy,
  OnInit,
} from '@angular/core';
import {AxisSettingsChange, ChartVisualizer, ClickEvent, ValueChange} from '../../visualizer/chart-visualizer';
import {ChartData, ChartSettings} from '../convertor/chart-data';
import {Subject, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {ConfigurationService} from '../../../../../configuration/configuration.service';

@Component({
  selector: 'chart-visualizer',
  templateUrl: './chart-visualizer.component.html',
  styleUrls: ['./chart-visualizer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartVisualizerComponent implements OnInit, OnChanges, OnDestroy {
  @Input()
  public chartData: ChartData;

  @Input()
  public chartSettings: ChartSettings;

  @Output()
  public change = new EventEmitter<ValueChange>();

  @Output()
  public doubleClick = new EventEmitter<ClickEvent>();

  @Output()
  public axisSettingsChange = new EventEmitter<AxisSettingsChange>();

  @ViewChild('chart', {static: true})
  private chartElement: ElementRef;

  private chartVisualizer: ChartVisualizer;

  private subscriptions = new Subscription();
  private axisSettingsChangeSubject$ = new Subject<AxisSettingsChange>();

  constructor(private configurationService: ConfigurationService) {}

  public ngOnInit() {
    this.subscribeConfigChange();
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.chartData && this.chartData) {
      this.visualize();
    } else if (changes.chartSettings && this.chartSettings) {
      this.chartVisualizer?.refreshSettings(this.chartSettings);
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
    this.chartVisualizer.refreshChart(this.chartData, this.chartSettings);
  }

  private createChart() {
    this.chartVisualizer = new ChartVisualizer(this.chartElement);
    this.chartVisualizer.setLocale(this.configurationService.getConfiguration().locale);
    this.chartVisualizer.setOnValueChanged(event => this.change.emit(event));
    this.chartVisualizer.setOnDoubleClick(event => this.doubleClick.emit(event));
    this.chartVisualizer.setOnAxisSettingsChange(event => this.axisSettingsChangeSubject$.next(event));
    this.chartVisualizer.setWriteEnabled(this.isWritable());
    this.chartVisualizer.createChart(this.chartData, this.chartSettings);
  }

  private isWritable(): boolean {
    return this.chartData ? this.chartData.sets.some(set => set.draggable) : false;
  }

  public ngOnDestroy() {
    this.chartVisualizer?.destroyChart();
    this.subscriptions.unsubscribe();
  }

  public resize() {
    this.chartVisualizer?.resize();
  }

  private subscribeConfigChange() {
    this.subscriptions.add(
      this.axisSettingsChangeSubject$.pipe(debounceTime(100)).subscribe(event => this.axisSettingsChange.emit(event))
    );
  }
}
