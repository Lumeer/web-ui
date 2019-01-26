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
  Component,
  ChangeDetectionStrategy,
  Input,
  Output,
  EventEmitter,
  SimpleChanges,
  OnChanges,
  Renderer2,
} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {
  GANTT_DATE_FORMAT,
  GanttChartBarPropertyOptional,
  GanttChartBarPropertyRequired,
  GanttChartConfig,
  GanttChartTask,
} from '../../../../core/store/gantt-charts/gantt-chart';
import * as frappeGantt from 'frappe-gantt';
import * as moment from 'moment';
import {isNullOrUndefined, isNumeric} from '../../../../shared/utils/common.utils';
import {shadeColor} from '../../../../shared/utils/html-modifier';

@Component({
  selector: 'gantt-chart-visualization',
  templateUrl: './gantt-chart-visualization.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartVisualizationComponent implements OnChanges {
  @Input()
  public collection: Collection;

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: GanttChartConfig;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  public ganttChart: frappeGantt;

  constructor(private renderer: Renderer2) {}

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.documents || changes.config) && this.config) {
      this.visualize();
    }
    if (changes.collection && this.collection) {
      this.setChartColors();
    }
  }

  private setChartColors() {
    const barColor = shadeColor(this.collection.color, 0.5);
    const progressColor = shadeColor(this.collection.color, 0.3);

    const barElements = document.querySelectorAll('.gantt .bar');
    const progressElements = document.querySelectorAll('.gantt .bar-progress');

    for (let i = 0; i < barElements.length; i++) {
      this.renderer.setStyle(barElements.item(i), 'fill', barColor);
    }

    for (let i = 0; i < progressElements.length; i++) {
      this.renderer.setStyle(progressElements.item(i), 'fill', progressColor);
    }
  }

  private refreshChart() {
    const tasks = this.createChartTasks();
    this.ganttChart.refresh(tasks);
    this.ganttChart.change_view_mode(this.config.mode);
    this.setChartColors();
  }

  private createChart() {
    const tasks = this.createChartTasks();
    this.createChartAndInitListeners(tasks);
    this.setChartColors();
  }

  private createChartTasks(): GanttChartTask[] {
    const nameProperty = this.config.barsProperties[GanttChartBarPropertyRequired.NAME];
    const startProperty = this.config.barsProperties[GanttChartBarPropertyRequired.START];
    const endProperty = this.config.barsProperties[GanttChartBarPropertyRequired.END];
    const idProperty = this.config.barsProperties[GanttChartBarPropertyOptional.ID];
    const dependenciesProperty = this.config.barsProperties[GanttChartBarPropertyOptional.DEPENDENCIES];
    const progressProperty = this.config.barsProperties[GanttChartBarPropertyOptional.PROGRESS];

    const tasks = [];

    for (const document of this.documents) {
      const name = nameProperty && document.data[nameProperty.attributeId];
      const start = startProperty && document.data[startProperty.attributeId];
      const end = endProperty && document.data[endProperty.attributeId];

      const id = idProperty && document.data[idProperty.attributeId];
      const dependencies = dependenciesProperty && document.data[dependenciesProperty.attributeId];
      const progress = (progressProperty && document.data[progressProperty.attributeId]) || 0;

      const task = {name, start, end, id, dependencies, progress};

      if (this.isTaskValid(task)) {
        tasks.push({
          ...task,
          start: this.cleanDate(task.start),
          end: this.cleanDate(task.end),
          progress: Math.max(+task.progress, 0),
          documentId: document.id,
        });
      }
    }

    return tasks;
  }

  private isTaskValid(task: GanttChartTask): boolean {
    return (
      task.name &&
      (task.start && this.isDateValid(task.start)) &&
      (task.end && this.isDateValid(task.end)) &&
      (isNullOrUndefined(task.progress) || isNumeric(task.progress))
    );
  }

  private isDateValid(date: string): boolean {
    return moment(date).isValid();
  }

  private cleanDate(date: string): string {
    return moment(date).format(GANTT_DATE_FORMAT);
  }

  private createChartAndInitListeners(tasks: GanttChartTask[]) {
    if (tasks.length === 0) {
      return;
    }

    this.ganttChart = new frappeGantt.default('#ganttChart', tasks, {
      on_date_change: (task, start, end) => {
        const startAttributeId = this.config.barsProperties[GanttChartBarPropertyRequired.START].attributeId;
        const endAttributeId = this.config.barsProperties[GanttChartBarPropertyRequired.END].attributeId;

        const startTimeTask = moment(task.start, GANTT_DATE_FORMAT).local();
        const startTime = moment(start, GANTT_DATE_FORMAT).local();

        const endTimeTask = moment(task.end, GANTT_DATE_FORMAT).local();
        const endTime = moment(end, GANTT_DATE_FORMAT).local();

        //start time changed
        if (!startTimeTask.isSame(startTime)) {
          this.onValueChanged(task.documentId, startAttributeId, startTime.format(GANTT_DATE_FORMAT));
        }

        //end time changed
        if (!endTimeTask.isSame(endTime)) {
          this.onValueChanged(task.documentId, endAttributeId, endTime.format(GANTT_DATE_FORMAT));
        }
      },

      on_progress_change: (task, progress) => {
        const progressAttributeId = this.config.barsProperties[GanttChartBarPropertyOptional.PROGRESS].attributeId;

        this.onValueChanged(task.documentId, progressAttributeId, progress);
      },
    });
    this.ganttChart.change_view_mode(this.config.mode);
  }

  private visualize() {
    if (this.ganttChart) {
      this.refreshChart();
    } else {
      this.createChart();
    }
  }

  private onValueChanged(documentId: string, attributeId: string, value: string) {
    const changedDocument = this.documents.find(document => document.id === documentId);
    if (!changedDocument) {
      return;
    }

    const patchDocument = {...changedDocument, data: {[attributeId]: value}};
    this.patchData.emit(patchDocument);
  }
}
