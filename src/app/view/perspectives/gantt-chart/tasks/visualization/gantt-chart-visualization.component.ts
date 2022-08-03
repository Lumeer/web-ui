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

import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {AttributesResourceType} from '../../../../../core/model/resource';
import Gantt, {GanttOptions, GanttTask} from '@lumeer/lumeer-gantt';
import {Subject, Subscription} from 'rxjs';
import {debounceTime} from 'rxjs/operators';
import {ganttTaskBarModel, ganttTaskDataResourceId} from '../../util/gantt-chart-util';

@Component({
  selector: 'gantt-chart-visualization',
  templateUrl: './gantt-chart-visualization.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartVisualizationComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  @Input()
  public tasks: GanttTask[];

  @Input()
  public canManageConfig: boolean;

  @Input()
  public options: GanttOptions;

  @Input()
  public currentMode: string;

  @Output()
  public taskChange = new EventEmitter<GanttTask>();

  @Output()
  public addDependency = new EventEmitter<{fromId: string; toId: string}>();

  @Output()
  public removeDependency = new EventEmitter<{fromId: string; toId: string}>();

  @Output()
  public swimlaneResize = new EventEmitter<{index: number; width: number}>();

  @Output()
  public positionChanged = new EventEmitter<number>();

  @Output()
  public taskCreate = new EventEmitter<GanttTask>();

  @Output()
  public taskDetail = new EventEmitter<GanttTask>();

  @ViewChild('ganttElement')
  public ganttElement: ElementRef<HTMLElement>;

  public ganttChart: Gantt;

  private positionSubject = new Subject<number>();
  private subscriptions = new Subscription();

  public ngOnInit() {
    const subscription = this.positionSubject
      .pipe(debounceTime(300))
      .subscribe(scroll => this.positionChanged.emit(scroll));
    this.subscriptions.add(subscription);
  }

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
    } else if (this.options) {
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
    this.ganttChart?.changeViewMode(mode as any);
  }

  public scrollToToday() {
    this.ganttChart?.scrollToToday();
  }

  public ngAfterViewInit() {
    if (!this.ganttChart && this.options) {
      this.createChart();
    }
  }

  private createChartAndInitListeners() {
    if (!this.ganttElement?.nativeElement) {
      return;
    }

    this.ganttChart = new Gantt(this.ganttElement.nativeElement, this.tasks, this.options);
    this.ganttChart.onSwimlaneResized = (index, width) => this.onSwimlaneResized(index, width);
    this.ganttChart.onTaskChanged = task => this.onTaskChanged(task);
    this.ganttChart.onTaskDependencyAdded = (fromTask, toTask) => this.onDependencyAdded(fromTask, toTask);
    this.ganttChart.onTaskDependencyRemoved = (fromTask, toTask) => this.onDependencyRemoved(fromTask, toTask);
    this.ganttChart.onTaskCreated = task => this.onTaskCreated(task);
    this.ganttChart.onTaskDetail = task => this.onTaskDetail(task);
    this.ganttChart.onScrolledHorizontally = value => this.positionSubject.next(value);
  }

  private onSwimlaneResized(index: number, width: number) {
    this.swimlaneResize.emit({index, width});
  }

  private onTaskChanged(task: GanttTask) {
    this.taskChange.emit(task);
  }

  private onTaskDetail(task: GanttTask) {
    this.taskDetail.emit(task);
  }

  private onTaskCreated(task: GanttTask) {
    this.taskCreate.emit(task);
  }

  private onDependencyAdded(fromTask: GanttTask, toTask: GanttTask) {
    if (this.canEditDependency(fromTask, toTask)) {
      this.addDependency.next({fromId: ganttTaskDataResourceId(fromTask), toId: ganttTaskDataResourceId(toTask)});
    }
  }

  private onDependencyRemoved(fromTask: GanttTask, toTask: GanttTask) {
    if (this.canEditDependency(fromTask, toTask)) {
      this.removeDependency.next({fromId: ganttTaskDataResourceId(fromTask), toId: ganttTaskDataResourceId(toTask)});
    }
  }

  private canEditDependency(fromTask: GanttTask, toTask: GanttTask): boolean {
    const fromTaskModel = ganttTaskBarModel(fromTask);
    const toTaskModel = ganttTaskBarModel(toTask);
    if (!fromTask || !toTask) {
      return false;
    }

    return (
      fromTaskModel.resourceType === AttributesResourceType.Collection &&
      fromTaskModel.resourceType === toTaskModel.resourceType &&
      fromTaskModel.resourceId === toTaskModel.resourceId &&
      ganttTaskDataResourceId(fromTask) !== ganttTaskDataResourceId(toTask)
    );
  }

  public removeTask(task: GanttTask) {
    this.ganttChart.removeTask(task);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
