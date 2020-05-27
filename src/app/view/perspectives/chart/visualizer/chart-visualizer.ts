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

import {ElementRef} from '@angular/core';
import {Config, d3, Data, Layout, newPlot, PlotRelayoutEvent, Plots, purge, react} from 'plotly.js';
import {environment} from '../../../../../environments/environment';
import {ChartAxisType, ChartType} from '../../../../core/store/charts/chart';
import {DataChange, PlotMaker} from './plot-maker/plot-maker';
import {ChartData, ChartSettings} from '../data/convertor/chart-data';
import {DraggablePlotMaker} from './plot-maker/draggable-plot-maker';
import {LinePlotMaker} from './plot-maker/line-plot-maker';
import {BarPlotMaker} from './plot-maker/bar-plot-maker';
import {PiePlotMaker} from './plot-maker/pie-plot-maker';
import {BubblePlotMaker} from './plot-maker/bubble-plot-maker';
import {AttributesResourceType} from '../../../../core/model/resource';
import {deepArrayEquals} from '../../../../shared/utils/array.utils';

export class ChartVisualizer {
  private currentType: ChartType;

  private data: Data[] = [];

  private layout: Partial<Layout>;

  private config: Partial<Config> = this.createConfig();

  private revision = 1;

  private plotMaker: PlotMaker;

  private writable: boolean;

  private onValueChanged: (ValueChange) => void;
  private onDoubleClick: (ClickEvent) => void;
  private onAxisSettingsChange: (AxisSettingsChange) => void;

  constructor(private chartElement: ElementRef) {
  }

  public setOnValueChanged(onValueChanged: (ValueChange) => void) {
    this.onValueChanged = onValueChanged;
  }

  public setOnDoubleClick(onDoubleClick: (ClickEvent) => void) {
    this.onDoubleClick = onDoubleClick;
  }

  public setOnAxisSettingsChange(onAxisSettingsChange: (AxisSettingsChange) => void) {
    this.onAxisSettingsChange = onAxisSettingsChange;
  }

  public createChart(data: ChartData, settings: ChartSettings) {
    this.createOrRefreshData(data);
    this.setLayoutSettings(settings);
    this.currentType = data.type;
    newPlot(this.chartElement.nativeElement, this.data, this.layout, this.config).then(() => this.refreshListeners());
    this.chartElement.nativeElement.on(
      'plotly_relayout',
      (event: PlotRelayoutEvent) => {
        this.onRelayout(event);
        this.plotMaker instanceof DraggablePlotMaker && (<DraggablePlotMaker>this.plotMaker).onRelayout();
      }
    );
  }

  private onRelayout(event: PlotRelayoutEvent) {
    const axisSettingsChange: AxisSettingsChange = {range: {}};

    const xAxisChange = this.parseRangeChangeForAxis(event, 'xaxis');
    if (xAxisChange !== undefined) {
      axisSettingsChange.range.x = xAxisChange;
    }

    const y1AxisChange = this.parseRangeChangeForAxis(event, 'yaxis');
    if (y1AxisChange !== undefined) {
      axisSettingsChange.range.y1 = y1AxisChange;
    }

    const y2AxisChange = this.parseRangeChangeForAxis(event, 'yaxis2');
    if (y2AxisChange !== undefined) {
      axisSettingsChange.range.y2 = y2AxisChange;
    }

    if (Object.keys(axisSettingsChange.range).length > 0) {
      this.onAxisSettingsChange(axisSettingsChange);
    }
  }

  private parseRangeChangeForAxis(event: PlotRelayoutEvent, axis: string): [number, number] | null | undefined {
    if (event[`${axis}.autorange`]) {
      return null;
    } else if (event[`${axis}.range[0]`] && event[`${axis}.range[1]`]) {
      return [+event[`${axis}.range[0]`], +event[`${axis}.range[1]`]];
    }
    return undefined;
  }

  public refreshChart(data: ChartData, settings: ChartSettings) {
    this.createOrRefreshData(data);
    this.setLayoutSettings(settings);
    this.currentType = data.type;
    console.log({...this.layout});
    react(this.chartElement.nativeElement, this.data, this.layout).then(() => this.refreshListeners());
  }

  public refreshSettings(settings: ChartSettings) {
    this.setLayoutSettings(settings); // TODO check?
    this.incRevisionNumber();
    console.log({...this.layout});
    react(this.chartElement.nativeElement, this.data, this.layout).then(() => this.refreshListeners());
  }

  private setLayoutSettings(chartSettings: ChartSettings) {
    if (!chartSettings || !this.layout) {
      return;
    }

    if (chartSettings.rangeSlider) {
      this.layout.xaxis && (this.layout.xaxis.rangeslider = {});
    } else {
      delete this.layout.xaxis?.rangeslider;
    }

    this.setLayoutAxisRange('xaxis', chartSettings, ChartAxisType.X);
    this.setLayoutAxisRange('yaxis', chartSettings, ChartAxisType.Y1);
    this.setLayoutAxisRange('yaxis2', chartSettings, ChartAxisType.Y2);
  }

  private setLayoutAxisRange(axisParam: string, chartSettings: ChartSettings, axisType: ChartAxisType) {
    const axis = this.layout[axisParam];
    if (!axis) {
      return;
    }

    const range = chartSettings.settings?.[axisType]?.range;
    if (range && !deepArrayEquals(axis.range, range)) {
      axis.autorange = false;
      axis.range = range;
    } else {
      axis.autorange = true;
      delete axis.range;
    }
  }

  public destroyChart() {
    purge(this.chartElement.nativeElement);
  }

  private createOrRefreshData(data: ChartData) {
    const shouldRefreshPlotMaker = this.shouldRefreshPlotMaker(data);
    if (shouldRefreshPlotMaker) {
      this.plotMaker = this.createPlotMakerByType(data.type, this.chartElement);
      this.plotMaker.setOnDataChanged(change => this.onDataChanged(change));
      this.plotMaker.setOnValueChanged(this.onValueChanged);
      this.plotMaker.setOnDoubleClick(this.onDoubleClick);
    }

    this.setFormatters(data);
    this.plotMaker.updateData(data);
    this.layout = this.plotMaker.createLayout();
    this.data = this.plotMaker.createData();

    this.incRevisionNumber();
  }

  private setFormatters(data: ChartData) {
    const currentLocale = d3.locale;
    d3.locale = locale => {
      const result = currentLocale(locale);
      const numberFormat = result.numberFormat;
      result.numberFormat = format => {
        if (format === 'xFormatter' && data.xAxisData?.formatter) {
          return x => data.xAxisData.formatter(x);
        }
        if (format === 'y1Formatter' && data.y1AxisData?.formatter) {
          return x => data.y1AxisData.formatter(x);
        }
        if (format === 'y2Formatter' && data.y2AxisData?.formatter) {
          return x => data.y2AxisData.formatter(x);
        }
        return numberFormat(format);
      };
      return result;
    };
  }

  private shouldRefreshPlotMaker(data: ChartData): boolean {
    return !this.currentType || this.currentType !== data.type;
  }

  public onDataChanged(change: DataChange) {
    this.data[change.trace][change.axis][change.index] = change.value;
    this.incRevisionNumber();
    react(this.chartElement.nativeElement, this.data, this.layout).then(() => this.refreshListeners());
  }

  private createPlotMakerByType(type: ChartType, element: ElementRef): PlotMaker {
    switch (type) {
      case ChartType.Line:
        return new LinePlotMaker(element);
      case ChartType.Bar:
        return new BarPlotMaker(element);
      case ChartType.Bubble:
        return new BubblePlotMaker(element);
      case ChartType.Pie:
        return new PiePlotMaker(element);
    }
  }

  public setWriteEnabled(enabled: boolean) {
    this.writable = enabled;
  }

  private refreshListeners() {
    this.plotMaker.initDoubleClick();

    if (this.plotMaker instanceof DraggablePlotMaker) {
      const draggablePlotMaker = this.plotMaker as DraggablePlotMaker;
      draggablePlotMaker.setDragEnabled(this.writable);

      if (this.writable) {
        draggablePlotMaker.initDrag();
      } else {
        draggablePlotMaker.destroyDrag();
      }
    }
  }

  private incRevisionNumber() {
    this.layout['datarevision'] = this.revision++;
  }

  private createConfig(): Partial<Config> {
    return {responsive: true, locale: environment.locale};
  }

  public resize() {
    Plots.resize(this.chartElement.nativeElement);
  }
}


export interface AxisSettingsChange {
  range?: Partial<Record<ChartAxisType, [number, number] | null>>;
}

export interface ClickEvent {
  setId: string;
  pointId: string;
  resourceType: AttributesResourceType;
}

export interface ValueChange {
  setId: string;
  pointId: string;
  value: string;
  resourceType: AttributesResourceType;
}
