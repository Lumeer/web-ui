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

import {Data, Layout} from 'plotly.js';
import {DateTimeConstraintConfig, PercentageConstraintConfig} from '../../../../../core/model/data/constraint-config';
import {ChartAxisCategory, ChartDataSet, convertChartDateFormat} from '../../data/convertor/chart-data';
import {isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';
import {PlotMaker} from './plot-maker';
import {ChartAxisType} from '../../../../../core/store/charts/chart';
import {shadeColor} from '../../../../../shared/utils/html-modifier';
import * as moment from 'moment';
import {formatDateTimeDataValue} from '../../../../../shared/utils/data.utils';

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
    return this.chartData.sets.filter(
      set =>
        set.yAxisType === ChartAxisType.Y1 &&
        this.isNumericCategory(set.yAxis && set.yAxis.category) &&
        set.points.some(point => isNotNullOrUndefined(point.x) && isNotNullOrUndefined(point.y))
    );
  }

  private getDataStyle(): Data {
    const trace = {};
    trace['type'] = 'pie';

    return trace;
  }

  private createEmptyPie(): Data {
    const setWithColor = this.chartData.sets.find(set => isNotNullOrUndefined(set.color));
    const color = setWithColor && setWithColor.color;

    const dataStyle = this.getDataStyle();
    dataStyle['showlegend'] = false;
    dataStyle['hoverinfo'] = 'none';
    dataStyle['textinfo'] = 'none';
    if (color) {
      dataStyle['marker'] = {colors: [shadeColor(color, 0.7)]};
    }
    return {...dataStyle, labels: [''], values: [20]};
  }

  private createAxesData(dataStyle: Data, set: ChartDataSet, row?: number, column?: number): Data {
    const data = {...dataStyle};

    const traceX = [];
    const traceY = [];

    set.points
      .filter(point => isNotNullOrUndefined(point.x) && isNotNullOrUndefined(point.y))
      .forEach(point => {
        traceX.push(this.mapPointXValue(point.x));
        traceY.push(point.y);
      });

    set.name && (data['name'] = set.name);
    data['labels'] = traceX;
    data['values'] = traceY;

    if (isNotNullOrUndefined(row) && isNotNullOrUndefined(column)) {
      data['domain'] = {row, column};
    }

    return data;
  }

  private mapPointXValue(value: any): any {
    if (!value) {
      return value;
    }

    const category = this.axisCategory(ChartAxisType.X);
    const config = this.axisConfig(ChartAxisType.X);

    if (category === ChartAxisCategory.Date) {
      const dateConfig = config as DateTimeConstraintConfig;
      const format = convertChartDateFormat(dateConfig && dateConfig.format);
      return formatDateTimeDataValue(moment(value, format).toDate(), dateConfig);
    } else if (category === ChartAxisCategory.Percentage) {
      return value + '%';
    }

    return value;
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
