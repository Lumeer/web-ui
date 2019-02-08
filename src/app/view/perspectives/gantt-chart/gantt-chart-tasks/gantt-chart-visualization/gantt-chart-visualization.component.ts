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
import {
  GANTT_DATE_FORMAT,
  GanttChartBarPropertyOptional,
  GanttChartConfig,
  GanttChartTask,
} from '../../../../../core/store/gantt-charts/gantt-chart';
import * as frappeGantt from 'frappe-gantt';
import * as moment from 'moment';
import {shadeColor} from '../../../../../shared/utils/html-modifier';
import {ganttTasksChanged} from '../../util/gantt-chart-util';

@Component({
  selector: 'gantt-chart-visualization',
  templateUrl: './gantt-chart-visualization.component.html',
  styleUrls: ['./gantt-chart-visualization.component.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartVisualizationComponent implements OnChanges {
  @Input()
  public config: GanttChartConfig;

  @Input()
  public tasks: GanttChartTask[];

  @Input()
  public canManageConfig: boolean;

  @Output()
  public patchData = new EventEmitter<{documentId: string; attributeId: string; value: any}>();

  public ganttChart: frappeGantt;

  constructor(private renderer: Renderer2) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.tasks && this.tasks) {
      if (ganttTasksChanged(this.tasks, this.ganttChart && this.ganttChart.tasks)) {
        this.visualize();
      }
    } else if (changes.config && this.config && this.ganttChart && !this.ganttChart.view_is(this.config.mode)) {
      this.ganttChart.change_view_mode(this.config.mode);
      this.setChartColorsAndListeners();
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
    if (this.tasks.length) {
      this.ganttChart.refresh(this.tasks);
      this.ganttChart.change_view_mode(this.config.mode);
      this.setChartColorsAndListeners();
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
    this.ganttChart = new frappeGantt.default('#ganttChart', tasks, {
      on_date_change: (task, start, end) => {
        if (task.disabled) {
          return;
        }

        const startAttributeId = task.startAttributeId;
        const endAttributeId = task.endAttributeId;

        const startTimeTask = moment(task.start, GANTT_DATE_FORMAT).local();
        const startTime = moment(start, GANTT_DATE_FORMAT).local();

        const endTimeTask = moment(task.end, GANTT_DATE_FORMAT).local();
        const endTime = moment(end, GANTT_DATE_FORMAT).local();

        //start time changed
        if (!startTimeTask.isSame(startTime)) {
          const startFormatted = startTime.format(GANTT_DATE_FORMAT);
          task.start = startFormatted;
          this.onValueChanged(task.id, startAttributeId, startFormatted);
        }

        //end time changed
        if (!endTimeTask.isSame(endTime)) {
          const endFormatted = endTime.format(GANTT_DATE_FORMAT);
          task.end = endFormatted;
          this.onValueChanged(task.id, endAttributeId, endFormatted);
        }
      },

      on_progress_change: (task, progress) => {
        if (task.disabled) {
          return;
        }

        const collectionId = task.collectionId;
        const collectionConfig = this.config.collections[collectionId];

        const progressAttributeId = collectionConfig.barsProperties[GanttChartBarPropertyOptional.PROGRESS].attributeId;
        if (task.progress !== progress) {
          task.progress = progress;
          this.onValueChanged(task.id, progressAttributeId, progress);
        }
      },
    });
    this.ganttChart.change_view_mode(this.config.mode);
  }

  private onValueChanged(documentId: string, attributeId: string, value: string) {
    this.patchData.emit({documentId, attributeId, value});
  }
}
