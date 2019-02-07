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

import {Data, Layout} from 'plotly.js';
import {ChartDataSet} from '../../chart-data/convertor/chart-data';
import {isNotNullOrUndefind} from '../../../../../shared/utils/common.utils';
import {PlotMaker} from './plot-maker';
import {ChartAxisType} from '../../../../../core/store/charts/chart';

const MAX_COLUMNS = 3;

export class PiePlotMaker extends PlotMaker {
  public createData(): Data[] {
    const dataStyle = this.getDataStyle();

    const sets = this.getSets();
    const columns = Math.min(sets.length, MAX_COLUMNS);

    return sets.map((set, index) => {
      const row = sets.length > 1 ? Math.floor(index / MAX_COLUMNS) : null;
      const column = sets.length > 1 ? index % columns : null;
      return this.createAxesData(dataStyle, set, row, column);
    });
  }

  private getSets(): ChartDataSet[] {
    return this.chartData.sets.filter(set => set.yAxisType === ChartAxisType.Y1 && set.isNumeric);
  }

  private getDataStyle(): Data {
    const trace = {};
    trace['type'] = 'pie';

    return trace;
  }

  private createAxesData(dataStyle: Data, set: ChartDataSet, row?: number, column?: number): Data {
    const data = {...dataStyle};

    const traceX = [];
    const traceY = [];

    set.points.forEach(point => {
      traceX.push(point.x);
      traceY.push(point.y);
    });

    set.name && (data['name'] = set.name);
    data['labels'] = traceX;
    data['values'] = traceY;

    if (isNotNullOrUndefind(row) && isNotNullOrUndefind(column)) {
      data['domain'] = {row, column};
    }

    return data;
  }

  public createLayout(): Partial<Layout> {
    const sets = this.getSets();
    if (sets.length > 1) {
      const rows = Math.floor((sets.length - 1) / MAX_COLUMNS) + 1;
      const columns = Math.min(sets.length, MAX_COLUMNS);
      const layout = {};
      layout['grid'] = {rows, columns};
      return layout;
    }
    return {};
  }
}
