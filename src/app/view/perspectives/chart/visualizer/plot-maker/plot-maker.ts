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

import {Data, Layout} from 'plotly.js';
import {AttributesResourceType} from '../../../../../core/model/resource';
import {ChartData, ChartDataSet, ChartYAxisType} from '../../data/convertor/chart-data';
import {ConstraintType} from '../../../../../core/model/data/constraint';
import {ChartAxisType} from '../../../../../core/store/charts/chart';

export abstract class PlotMaker {
  protected chartData: ChartData;

  protected onValueChanged?: (ValueChange) => void;

  protected onDataChanged?: (DataChange) => void;

  protected onDoubleClick?: (ClickEvent) => void;

  constructor(protected element: ElementRef) {
  }

  public updateData(chartData: ChartData) {
    this.chartData = chartData;
  }

  public setOnValueChanged(onValueChanged: (valueChange: ValueChange) => void) {
    this.onValueChanged = onValueChanged;
  }

  public setOnDoubleClick(callback: (ClickEvent) => void) {
    this.onDoubleClick = callback;
  }

  public setOnDataChanged(onDataChanged: (dataChange: DataChange) => void) {
    this.onDataChanged = onDataChanged;
  }

  public abstract createData(): Data[];

  public abstract createLayout(): Partial<Layout>;

  protected getAxisDataSets(type: ChartYAxisType): ChartDataSet[] {
    return this.chartData.sets.filter(set => set.yAxisType === type);
  }

  protected isNumericType(type: ConstraintType) {
    return [ConstraintType.Percentage, ConstraintType.Number, ConstraintType.Duration].includes(type); // TODO else?
  }

  protected isCategoryType(type: ConstraintType): boolean {
    return type === ConstraintType.Text; // TODO ??
  }

  protected axisConstraintType(type: ChartAxisType): ConstraintType {
    if (type === ChartAxisType.X) {
      return this.chartData.xAxisData?.constraintType || ConstraintType.Unknown;
    }
    if (type === ChartAxisType.Y1) {
      return this.chartData.y1AxisData?.constraintType || ConstraintType.Unknown;
    }
    if (type === ChartAxisType.Y2) {
      return this.chartData.y2AxisData?.constraintType || ConstraintType.Unknown;
    }

    return ConstraintType.Unknown;
  }
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

export interface DataChange {
  trace: number;
  axis: string;
  index: number;
  value: string;
}
