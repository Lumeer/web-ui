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

import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  Renderer2,
  SimpleChanges,
  ViewEncapsulation,
} from '@angular/core';
import {GanttChartMode, GanttChartTask} from '../../../../../core/store/gantt-charts/gantt-chart';
import * as frappeGantt from '@lumeer/frappe-gantt-lumeer';
import * as moment from 'moment';
import {shadeColor} from '../../../../../shared/utils/html-modifier';
import {isNotNullOrUndefined} from '../../../../../shared/utils/common.utils';

@Component({
  selector: 'gantt-chart-visualization',
  templateUrl: './gantt-chart-visualization.component.html',
  styleUrls: ['./gantt-chart-visualization.component.scss'],
  encapsulation: ViewEncapsulation.None,
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

  constructor(private renderer: Renderer2) {}

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
    if (this.tasks.length) {
      this.ganttChart.refresh(this.tasks);
      this.ganttChart.change_view_mode(this.currentMode);
      this.setChartColorsAndListeners();
      isNotNullOrUndefined(scrollLeft) && (this.ganttChart.$svg.parentElement.scrollLeft = scrollLeft);
    } else {
      this.ganttChart.clear();
      this.ganttChart = null;
    }
  }

  private createChart() {
    if (this.tasks.length) {
      this.createChartAndInitListeners(this.tasks);
      this.setChartColorsAndListeners();
    }
  }

  private modeChanged(changes: SimpleChanges): boolean {
    return changes.currentMode && this.ganttChart && !this.ganttChart.view_is(this.currentMode);
  }

  private refreshMode(mode: GanttChartMode) {
    this.ganttChart.change_view_mode(mode);
    this.setChartColorsAndListeners();
  }

  private setChartColorsAndListeners() {
    const tasksMap = this.ganttChart.tasks.reduce((map, task) => ({...map, [task.id]: task}), {});

    const disabledTaskIds = new Set();
    const barWrappers = document.querySelectorAll('.gantt .bar-wrapper');
    barWrappers.forEach(element => {
      const taskId = element.getAttribute('data-id');
      const task = tasksMap[taskId];
      if (!task) {
        return;
      }

      const barColor = shadeColor(task.color, 0.5);
      const progressColor = shadeColor(task.color, 0.3);

      const barElement = element.querySelector('.bar');
      barElement && this.renderer.setStyle(barElement, 'fill', barColor);

      const progressElement = element.querySelector('.bar-progress');
      progressElement && this.renderer.setStyle(progressElement, 'fill', progressColor);

      if (task.disabled) {
        this.removeListeners(element);
        disabledTaskIds.add(taskId);
      } else {
        const handleGroupElement = element.querySelector('.handle-group');
        if (!task.startAttributeId) {
          const handleElement = handleGroupElement.querySelector('.handle.left');
          handleElement && this.renderer.setStyle(handleElement, 'display', 'none');
        }
        if (!task.endAttributeId) {
          const handleElement = handleGroupElement.querySelector('.handle.left');
          handleElement && this.renderer.setStyle(handleElement, 'display', 'none');
        }
        if (!task.progressAttributeId) {
          const handleElement = handleGroupElement.querySelector('.handle.progress');
          handleElement && this.renderer.setStyle(handleElement, 'display', 'none');
        }
      }
    });

    const arrows = document.querySelector('.gantt .arrow');
    for (let i = 0; i < arrows.children.length; i++) {
      const arrow = arrows.children.item(i);
      const idFrom = arrow.getAttribute('data-from');
      const idTo = arrow.getAttribute('data-to');
      if (disabledTaskIds.has(idFrom) || disabledTaskIds.has(idTo)) {
        this.removeListeners(arrow);
      }
    }
  }

  private removeListeners(element: Element) {
    element && element.parentNode.replaceChild(element.cloneNode(true), element);
  }

  private createChartAndInitListeners(tasks: GanttChartTask[]) {
    this.ganttChart = new frappeGantt.default(`#ganttChart-${this.ganttChartId}`, tasks, {
      on_date_change: (task, start, end) => {
        if (task.disabled) {
          return;
        }

        const startAttributeId = task.startAttributeId;
        const endAttributeId = task.endAttributeId;

        // TODO due to frappe bug we need to add 1 hour
        const startTimeTask = moment(task.start).add(1, 'hours');
        const startTime = moment(start).add(1, 'hours');

        const endTimeTask = moment(task.end).add(1, 'hours');
        const endTime = moment(end).add(1, 'hours');

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
        if (task.disabled) {
          return;
        }

        const progressAttributeId = task.progressAttributeId;
        if (progressAttributeId) {
          task.progress = progress;
          this.onValueChanged(task.id, [{attributeId: progressAttributeId, value: progress}]);
        }
      },
    });
    this.ganttChart.change_view_mode(this.currentMode);
  }

  private onValueChanged(documentId: string, changes: {attributeId: string; value: string}[]) {
    this.patchData.emit({documentId, changes});
  }
}
