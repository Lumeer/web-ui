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

import {Pipe, PipeTransform} from '@angular/core';
import {SelectItemModel} from '../../../../shared/select/select-item/select-item.model';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {GanttChartMode} from "../../../../core/store/gantt-charts/gantt-chart.model";

@Pipe({
  name: 'ganttChartModesToSelect'
})
export class GanttChartModesToSelectPipe implements PipeTransform {

  public constructor(private i18n: I18n) {
  }

  public transform(modes: GanttChartMode[]): SelectItemModel[] {
    return modes.map(mode => ({id: mode, value: this.getTypeValue(mode)}));
  }

  private getTypeValue(mode: GanttChartMode): string {
    return this.i18n({
      id: 'ganttChart.mode',
      value: '{ganttChartMode, select, Day {Day} Quarter Day {Quarter Day} Half Day {Half Day} Week {Week} Month {Month}}'
    }, {
      ganttChartMode: mode
    });
  }

}
