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

import {PlotMaker} from './plot-maker';
import {ChartAxisModel, ChartAxisType, ChartType} from '../../../../../core/store/charts/chart.model';
import {Data, Layout} from 'plotly.js';

export class PiePlotMaker extends PlotMaker {
  public createData(): Data[] {
    const dataStyle = this.getDataStyle();

    const data = this.createAxesData(dataStyle, this.config.axes[ChartAxisType.X], this.config.axes[ChartAxisType.Y1]);
    return [data];
  }

  private getDataStyle(): Data {
    const trace = {};
    trace['type'] = 'pie';

    return trace;
  }

  private createAxesData(dataStyle: Data, xAxis?: ChartAxisModel, yAxis?: ChartAxisModel): Data {
    const data = {...dataStyle};

    const traceX = [];
    const traceY = [];

    for (const document of this.documents) {
      if (xAxis) {
        traceX.push(document.data[xAxis.attributeId]);
      }
      if (yAxis) {
        traceY.push(document.data[yAxis.attributeId]);
      }
    }

    if (xAxis) {
      data['labels'] = traceX;
    }

    if (yAxis) {
      data['values'] = traceY;
    }

    return data;
  }

  public createLayout(): Partial<Layout> {
    return {};
  }

  public currentType(): ChartType {
    return ChartType.Pie;
  }
}
