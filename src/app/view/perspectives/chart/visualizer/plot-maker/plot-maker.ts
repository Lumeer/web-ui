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
import {ChartAxisCategory, ChartData, ChartDataSet, ChartYAxisType} from '../../data/convertor/chart-data';
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {ConstraintConfig} from '../../../../../core/model/data/constraint';
import {AttributesResourceType} from '../../../../../core/model/resource';

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

  protected isNumericCategory(category: ChartAxisCategory) {
    return category === ChartAxisCategory.Percentage || category === ChartAxisCategory.Number;
  }

  protected isAxisCategoryText(type: ChartYAxisType): boolean {
    return this.axisCategory(type) === ChartAxisCategory.Text;
  }

  protected axisCategory(type: ChartAxisType): ChartAxisCategory {
    if (type === ChartAxisType.X) {
      const setWithXAxis = this.chartData.sets.find(set => !!set.xAxis);
      return (setWithXAxis && setWithXAxis.xAxis.category) || ChartAxisCategory.Text;
    }

    const sets = this.getAxisDataSets(type);
    return (sets.length >= 1 && sets[0].yAxis && sets[0].yAxis.category) || ChartAxisCategory.Text;
  }

  protected axisConfig(type: ChartAxisType): ConstraintConfig {
    if (type === ChartAxisType.X) {
      const setWithXAxis = this.chartData.sets.find(set => !!set.xAxis);
      return (setWithXAxis && setWithXAxis.xAxis.config) || {};
    }

    const sets = this.getAxisDataSets(type);
    return (sets.length >= 1 && sets[0].yAxis && sets[0].yAxis.config) || {};
  }

  protected getAxisDataSets(type: ChartYAxisType): ChartDataSet[] {
    return this.chartData.sets.filter(set => set.yAxisType === type);
  }
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
