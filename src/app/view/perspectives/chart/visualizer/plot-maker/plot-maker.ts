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

import {Data, Layout} from 'plotly.js';
import {ChartData} from '../../data/convertor/chart-data';
import {ChartAxisResourceType} from '../../../../../core/store/charts/chart';

export abstract class PlotMaker {
  protected chartData: ChartData;

  protected onValueChanged?: (valueChange: ValueChange) => void;

  protected onDataChanged?: (dataChange: DataChange) => void;

  constructor(protected element: ElementRef) {}

  public updateData(chartData: ChartData) {
    this.chartData = chartData;
  }

  public setOnValueChanged(onValueChanged: (valueChange: ValueChange) => void) {
    this.onValueChanged = onValueChanged;
  }

  public setOnDataChanged(onDataChanged: (dataChange: DataChange) => void) {
    this.onDataChanged = onDataChanged;
  }

  public abstract createData(): Data[];

  public abstract createLayout(): Partial<Layout>;
}

export interface ValueChange {
  setId: string;
  pointId: string;
  value: string;
  resourceType: ChartAxisResourceType;
}

export interface DataChange {
  trace: number;
  axis: string;
  index: number;
  value: string;
}
