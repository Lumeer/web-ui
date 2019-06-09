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
import {environment} from '../../../../../../environments/environment';
import {AttributesResourceType} from '../../../../../core/model/resource';

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
  public patchData = new EventEmitter<{
    dataResourceId: string;
    type: AttributesResourceType;
    collectionConfigId: string;
    changes: {attributeId: string; value: any}[];
  }>();

  @Output()
  public addDependency = new EventEmitter<{fromId: string; toId: string}>();

  @Output()
  public removeDependency = new EventEmitter<{fromId: string; toId: string}>();

  public ganttChart: frappeGantt;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.tasks && this.tasks) {
      this.visualize();
    } else if (this.modeChanged(changes)) {
      this.refreshMode(this.currentMode);
    }
  }

  private visualize() {
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
    const ganttElement = document.getElementById(`ganttChart-${this.ganttChartId}`);
    if (!ganttElement) {
      return;
    }
    this.ganttChart = new frappeGantt.default(ganttElement, tasks, {
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
          this.onValueChanged(task.dataResourceId, task.collectionConfigId, task.resourceType, changes);
        }
      },

      on_progress_change: (task, progress) => {
        if (!task.editable) {
          return;
        }

        const progressAttributeId = task.progressAttributeId;
        if (progressAttributeId) {
          task.progress = progress;
          this.onValueChanged(task.dataResourceId, task.collectionConfigId, task.resourceType, [
            {attributeId: progressAttributeId, value: progress},
          ]);
        }
      },
      on_dependency_added: (fromTask, toTask) => {
        if (this.canEditDependency(fromTask, toTask)) {
          this.addDependency.next({fromId: fromTask.dataResourceId, toId: toTask.dataResourceId});
        }
      },
      on_dependency_deleted: (fromTask, toTask) => {
        if (this.canEditDependency(fromTask, toTask)) {
          this.removeDependency.next({fromId: fromTask.dataResourceId, toId: toTask.dataResourceId});
        }
      },
      language: environment.locale,
      view_mode: this.currentMode,
    });
  }

  private canEditDependency(fromTask: GanttChartTask, toTask: GanttChartTask): boolean {
    return (
      fromTask.resourceType === AttributesResourceType.Collection &&
      fromTask.resourceType === toTask.resourceType &&
      fromTask.resourceId === toTask.resourceId
    );
  }

  private onValueChanged(
    dataResourceId: string,
    collectionConfigId: string,
    type: AttributesResourceType,
    changes: {attributeId: string; value: string}[]
  ) {
    this.patchData.emit({dataResourceId, collectionConfigId, type, changes});
  }
}
