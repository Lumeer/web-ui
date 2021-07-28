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

import {Annotations, Layout, PlotMarker, PlotType} from 'plotly.js';
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';
import {ChartDataSet} from '../../data/convertor/chart-data';
import {PlotlyChartData, PlotMaker} from './plot-maker';
import {uniqueValues} from '../../../../../shared/utils/array.utils';
import {ConstraintType} from '@lumeer/data-filters';

const MAX_COLUMNS = 3;
const HORIZONTAL_SPACING = 0.04;
const VERTICAL_SPACING = 0.08;

export class PiePlotMaker extends PlotMaker {
  public createData(): PlotlyChartData[] {
    const dataStyle = this.getDataStyle();

    const sets = this.getSets();

    if (sets.length === 0) {
      return [this.createEmptyPie()];
    }

    const columns = Math.min(sets.length, MAX_COLUMNS);
    const rows = numRows(sets);
    return sets.map((set, index) => {
      let x, y;
      if (sets.length) {
        x = computePieXRange(index, columns);
        y = computePieYRange(index, rows);
      }
      return this.createAxesData(dataStyle, set, x, y);
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

  private getDataStyle(): PlotlyChartData {
    return {type: <PlotType>'pie', marker: {}};
  }

  private createEmptyPie(): PlotlyChartData {
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

  private createAxesData(dataStyle: PlotlyChartData, set: ChartDataSet, x?: number[], y?: number[]): PlotlyChartData {
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

    const data = {...dataStyle, labels, values, name: set.name};
    if (this.shouldSetColors(colors)) {
      (data.marker as PlotMarker).colors = colors;
    }

    if (isNotNullOrUndefined(x) && isNotNullOrUndefined(y)) {
      data.domain = {x, y};
    }

    return data;
  }

  private shouldSetColors(colors: string[]): boolean {
    return uniqueValues(colors).length > 1;
  }

  public createLayout(): Partial<Layout> {
    const sets = this.getSets();
    if (sets.length > 1) {
      const rows = numRows(sets);
      const columns = numColumns(sets);
      const annotations: Partial<Annotations>[] = sets.map((set, index) => {
        const x = computePieXRange(index, columns);
        const y = computePieYRange(index, rows);
        return {
          text: `<b>${set.name || ''}</b>`,
          showarrow: false,
          x: x[0] + (x[1] - x[0]) / 2,
          y: y[1] + VERTICAL_SPACING / 2,
          font: {size: 16},
          xref: 'paper',
          yref: 'paper',
          xanchor: 'center',
          yanchor: 'middle',
        };
      });
      return {grid: {rows, columns}, annotations};
    }
    return {};
  }
}

function numRows(sets: ChartDataSet[]): number {
  return Math.floor((sets.length - 1) / MAX_COLUMNS) + 1;
}

function numColumns(sets: ChartDataSet[]): number {
  return Math.min(sets.length, MAX_COLUMNS);
}

function computePieSize(parts: number, spacingBetween: number, spacingBefore = 0): number {
  return (1 - (parts - 1) * spacingBetween - spacingBefore * 2) / parts;
}

function computePieXRange(index: number, columns: number): [number, number] {
  const spacing = HORIZONTAL_SPACING;
  const pieWidth = computePieSize(columns, spacing);

  const column = columnIndex(index, columns);
  const x1 = column * pieWidth + column * spacing;
  const x2 = (column + 1) * pieWidth + column * spacing;
  return [x1, Math.min(x2, 1)];
}

function computePieYRange(index: number, columns: number): [number, number] {
  const spacing = VERTICAL_SPACING;
  const pieWidth = computePieSize(columns, spacing, spacing / 2);

  const row = rowIndex(index);
  const y1 = row * pieWidth + (row + 1 / 2) * spacing;
  const y2 = (row + 1) * pieWidth + (row + 1 / 2) * spacing;
  return [1 - Math.min(y2, 1), 1 - y1];
}

function rowIndex(index: number): number {
  return Math.floor(index / MAX_COLUMNS);
}

function columnIndex(index: number, columns: number): number {
  return index % columns;
}
