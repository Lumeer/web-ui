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

import {Data, Layout, PlotType} from 'plotly.js';
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';
import {ChartDataSet} from '../../data/convertor/chart-data';
import {PlotMaker} from './plot-maker';
import {ConstraintType} from '../../../../../core/model/data/constraint';
import {uniqueValues} from '../../../../../shared/utils/array.utils';

const MAX_COLUMNS = 3;

export class PiePlotMaker extends PlotMaker {
  public createData(): Data[] {
    const dataStyle = this.getDataStyle();

    const sets = this.getSets();

    if (sets.length === 0) {
      return [this.createEmptyPie()];
    }

    const columns = Math.min(sets.length, MAX_COLUMNS);

    return sets.map((set, index) => {
      const row = sets.length > 1 ? Math.floor(index / MAX_COLUMNS) : null;
      const column = sets.length > 1 ? index % columns : null;
      return this.createAxesData(dataStyle, set, row, column);
    });
  }

  private getSets(): ChartDataSet[] {
    if (this.chartData.y1AxisData?.constraintType !== ConstraintType.Number) {
      return [];
    }
    return this.chartData.sets.filter(
      set =>
        set.yAxisType === ChartAxisType.Y1 &&
        set.points.some(point => isNotNullOrUndefined(point.x) && isNotNullOrUndefined(point.y))
    );
  }

  private getDataStyle(): Data {
    return {type: <PlotType>'pie', marker: {}};
  }

  private createEmptyPie(): Data {
    return {
      ...this.getDataStyle(),
      showlegend: false,
      hoverinfo: 'none' as const,
      textinfo: 'none' as const,
      labels: [''],
      values: [20],
    };
  }

  public initDoubleClick() {
    // nothing to do
  }

  private createAxesData(dataStyle: Data, set: ChartDataSet, row?: number, column?: number): Data {
    const labels = [];
    const values = [];
    const colors = [];

    set.points
      .filter(point => isNotNullOrUndefined(point.x) && isNotNullOrUndefined(point.y))
      .forEach(point => {
        labels.push(point.xTitle);
        values.push(point.y);
        colors.push(point.color);
      });

    const data = {...dataStyle, labels, values};
    if (this.shouldSetColors(colors)) {
      data.marker.colors = colors;
    }

    if (isNotNullOrUndefined(row) && isNotNullOrUndefined(column)) {
      data.domain = {rows: row, columns: column};
    }

    return data;
  }

  private shouldSetColors(colors: string[]): boolean {
    return uniqueValues(colors).length > 1;
  }

  public createLayout(): Partial<Layout> {
    const sets = this.getSets();
    if (sets.length > 1) {
      const rows = Math.floor((sets.length - 1) / MAX_COLUMNS) + 1;
      const columns = Math.min(sets.length, MAX_COLUMNS);
      return {grid: {rows, columns}};
    }
    return {};
  }
}
