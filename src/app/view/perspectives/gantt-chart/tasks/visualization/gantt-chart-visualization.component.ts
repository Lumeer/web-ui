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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {GanttChartMode, GanttChartTask} from '../../../../../core/store/gantt-charts/gantt-chart';
import * as frappeGantt from '@lumeer/frappe-gantt-lumeer';
import * as moment from 'moment';
import {isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';

@Component({
  selector: 'gantt-chart-visualization',
  templateUrl: './gantt-chart-visualization.component.html',
  styleUrls: ['./gantt-chart-visualization.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartVisualizationComponent implements OnChanges {
  @Input()
  public tasks: GanttChartTask[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public ganttChartId: string;

  @Input()
  public currentMode: GanttChartMode;

  @Output()
  public patchData = new EventEmitter<{documentId: string; changes: {attributeId: string; value: any}[]}>();

  public ganttChart: frappeGantt;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.tasks && this.tasks) {
      this.visualize();
    } else if (this.modeChanged(changes)) {
      this.refreshMode(this.currentMode);
    }
  }

  private visualize() {
    console.log([...this.tasks].map(t => ({...t})));
    if (this.ganttChart) {
      this.refreshChart();
    } else {
      this.createChart();
    }
  }

  private refreshChart() {
    const scrollLeft = this.ganttChart.$svg.parentElement && this.ganttChart.$svg.parentElement.scrollLeft;
    this.ganttChart.refresh(this.tasks);
    if (this.ganttChart.view_is(this.currentMode)) {
      isNotNullOrUndefined(scrollLeft) && (this.ganttChart.$svg.parentElement.scrollLeft = scrollLeft);
    } else {
      this.ganttChart.change_view_mode(this.currentMode);
    }
  }

  private createChart() {
    this.createChartAndInitListeners(this.tasks);
  }

  private modeChanged(changes: SimpleChanges): boolean {
    return changes.currentMode && this.ganttChart && !this.ganttChart.view_is(this.currentMode);
  }

  private refreshMode(mode: GanttChartMode) {
    this.ganttChart.change_view_mode(mode);
  }

  private createChartAndInitListeners(tasks: GanttChartTask[]) {
    this.ganttChart = new frappeGantt.default(`#ganttChart-${this.ganttChartId}`, tasks, {
      on_date_change: (task, start, end) => {
        if (!task.editable) {
          return;
        }

        const startAttributeId = task.startAttributeId;
        const endAttributeId = task.endAttributeId;

        const startTimeTask = moment(task.start);
        const startTime = moment(start);

        const endTimeTask = moment(task.end);
        const endTime = moment(end);

        console.log(task, start, end);

        const changes = [];

        //start time changed
        if (startAttributeId && !startTimeTask.isSame(startTime)) {
          changes.push({attributeId: startAttributeId, value: startTime.toDate()});
        }

        //end time changed
        if (endAttributeId && !endTimeTask.isSame(endTime)) {
          changes.push({attributeId: endAttributeId, value: endTime.toDate()});
        }

        if (changes) {
          this.onValueChanged(task.id, changes);
        }
      },

      on_progress_change: (task, progress) => {
        if (!task.editable) {
          return;
        }

        const progressAttributeId = task.progressAttributeId;
        if (progressAttributeId) {
          task.progress = progress;
          this.onValueChanged(task.id, [{attributeId: progressAttributeId, value: progress}]);
        }
      },
      on_dependency_added: dependency => {
        console.log(dependency);
      },
      on_dependency_deleted: dependency => {
        console.log(dependency);
      },
      language: 'en',
      view_mode: this.currentMode,
    });
  }

  private onValueChanged(documentId: string, changes: {attributeId: string; value: string}[]) {
    this.patchData.emit({documentId, changes});
  }
}
