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

import {Pipe, PipeTransform} from '@angular/core';
import {GANTT_DATE_FORMAT} from '../../../../core/store/gantt-charts/gantt-chart';
import {GanttTask} from '@lumeer/lumeer-gantt';
import * as moment from 'moment';

@Pipe({
  name: 'tasksInvalidRangeInfo',
})
export class TasksInvalidRangeInfoPipe implements PipeTransform {
  public transform(tasks: GanttTask[]): {minTask: GanttTask; minDate: Date; maxTask: GanttTask; maxDate: Date} {
    let minDate: Date = null;
    let minTask = null;
    let maxDate: Date = null;
    let maxTask = null;
    for (const task of tasks || []) {
      const taskStartDate = moment(task.start, GANTT_DATE_FORMAT).toDate();
      const taskEndDate = moment(task.end, GANTT_DATE_FORMAT).toDate();
      if (!minTask || !minDate || minDate.getTime() > taskStartDate.getTime()) {
        minDate = taskStartDate;
        minTask = task;
      }

      if (!maxTask || !maxDate || maxDate.getTime() < taskEndDate.getTime()) {
        maxDate = taskEndDate;
        maxTask = task;
      }
    }

    if (minTask && maxTask && !this.isValidRange(minDate, maxDate)) {
      return {minTask, minDate, maxTask, maxDate};
    }
    return null;
  }

  private isValidRange(minDate: Date, maxDate: Date): boolean {
    return Math.abs(minDate.getFullYear() - maxDate.getFullYear()) <= 25;
  }
}
