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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import * as moment from 'moment';
import {AttributesResourceType} from '../../../../../core/model/resource';
import Gantt from '@lumeer/lumeer-gantt';
import {GanttOptions} from '@lumeer/lumeer-gantt/dist/model/options';
import {Task as GanttChartTask} from '@lumeer/lumeer-gantt/dist/model/task';
import {GanttChartTaskMetadata} from '../../util/gantt-chart-converter';

export interface GanttChartValueChange {
  dataResourceId: string;
  resourceType: AttributesResourceType;
  changes: {attributeId: string; value: any}[];
}

@Component({
  selector: 'gantt-chart-visualization',
  templateUrl: './gantt-chart-visualization.component.html',
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
  public options: GanttOptions;

  @Input()
  public currentMode: string;

  @Output()
  public datesChange = new EventEmitter<GanttChartValueChange>();

  @Output()
  public progressChange = new EventEmitter<GanttChartValueChange>();

  @Output()
  public addDependency = new EventEmitter<{fromId: string; toId: string}>();

  @Output()
  public removeDependency = new EventEmitter<{fromId: string; toId: string}>();

  @Output()
  public swimlaneResize = new EventEmitter<{index: number; width: number}>();

  @Output()
  public swimlaneDrag = new EventEmitter<{id: string; resourceType: AttributesResourceType; swimlanes: string[]}>();

  public ganttChart: Gantt;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.tasks || changes.options) {
      this.visualize();
    } else if (this.modeChanged(changes)) {
      this.refreshMode(this.currentMode);
    }
  }

  private modeChanged(changes: SimpleChanges): boolean {
    return changes.currentMode && changes.currentMode.previousValue !== changes.currentMode.currentValue;
  }

  private visualize() {
    if (this.ganttChart) {
      this.refreshChart();
    } else {
      this.createChart();
    }
  }

  private refreshChart() {
    this.ganttChart.changeTasks(this.tasks, this.options);
  }

  private createChart() {
    this.createChartAndInitListeners();
  }

  private refreshMode(mode: string) {
    this.ganttChart.changeViewMode(mode as any);
  }

  public scrollToToday() {
    this.ganttChart && this.ganttChart.scrollToToday();
  }

  private createChartAndInitListeners() {
    const ganttElement = document.getElementById(`ganttChart-${this.ganttChartId}`);
    if (!ganttElement) {
      return;
    }

    this.ganttChart = new Gantt(ganttElement, this.tasks, this.options);
    this.ganttChart.onSwimlaneResized = (index, width) => this.onSwimlaneResized(index, width);
    this.ganttChart.onTaskProgressChanged = task => this.onProgressChanged(task);
    this.ganttChart.onTaskDatesChanged = task => this.onDatesChanged(task);
    this.ganttChart.onTaskDependencyAdded = (fromTask, toTask) => this.onDependencyAdded(fromTask, toTask);
    this.ganttChart.onTaskDependencyRemoved = (fromTask, toTask) => this.onDependencyRemoved(fromTask, toTask);
    this.ganttChart.onTaskSwimlanesChanged = task => this.onTaskSwimlaneChange(task);
  }

  private onSwimlaneResized(index: number, width: number) {
    this.swimlaneResize.emit({index, width});
  }

  private onProgressChanged(task: GanttChartTask) {
    const metadata: GanttChartTaskMetadata = task.metadata;
    const progressAttributeId = metadata.progressAttributeId;
    if (progressAttributeId) {
      this.progressChange.emit({...metadata, changes: [{attributeId: progressAttributeId, value: task.progress}]});
    }
  }

  private onDatesChanged(task: GanttChartTask) {
    const start = moment(task.start, this.options.dateFormat);
    const end = moment(task.end, this.options.dateFormat);

    const changes = [];
    const metadata: GanttChartTaskMetadata = task.metadata;

    if (metadata.startAttributeId) {
      changes.push({attributeId: metadata.startAttributeId, value: start.toDate()});
    }

    if (metadata.endAttributeId) {
      changes.push({attributeId: metadata.endAttributeId, value: end.toDate()});
    }

    if (changes.length) {
      this.datesChange.emit({...metadata, changes});
    }
  }

  private onDependencyAdded(fromTask: GanttChartTask, toTask: GanttChartTask) {
    if (this.canEditDependency(fromTask, toTask)) {
      this.addDependency.next({fromId: fromTask.metadata.dataResourceId, toId: toTask.metadata.dataResourceId});
    }
  }

  private onDependencyRemoved(fromTask: GanttChartTask, toTask: GanttChartTask) {
    if (this.canEditDependency(fromTask, toTask)) {
      this.removeDependency.next({fromId: fromTask.metadata.dataResourceId, toId: toTask.metadata.dataResourceId});
    }
  }

  private canEditDependency(fromTask: GanttChartTask, toTask: GanttChartTask): boolean {
    return (
      fromTask.metadata.resourceType === AttributesResourceType.Collection &&
      fromTask.metadata.resourceType === toTask.metadata.resourceType &&
      fromTask.metadata.resourceId === toTask.metadata.resourceId &&
      fromTask.metadata.dataResourceId !== toTask.metadata.dataResourceId
    );
  }

  private onTaskSwimlaneChange(task: GanttChartTask) {
    this.swimlaneDrag.emit({id: task.id, resourceType: task.metadata.resourceType, swimlanes: task.swimlanes});
  }
}
