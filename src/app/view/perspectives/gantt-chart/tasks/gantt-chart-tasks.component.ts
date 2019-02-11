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
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  Input,
  OnInit,
} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {GanttChartConfig, GanttChartMode, GanttChartTask} from '../../../../core/store/gantt-charts/gantt-chart';
import {BehaviorSubject, Observable} from 'rxjs';
import {debounceTime, filter, map} from 'rxjs/operators';
import {createGanttChartTasks} from '../util/gantt-chart-util';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';

interface Data {
  collections: Collection[];
  documents: DocumentModel[];
  config: GanttChartConfig;
  permissions: Record<string, AllowedPermissions>;
}

@Component({
  selector: 'gantt-chart-tasks',
  templateUrl: './gantt-chart-tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartTasksComponent implements OnInit, OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public documents: DocumentModel[];

  @Input()
  public config: GanttChartConfig;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public ganttChartId: string;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  @Output()
  public configChange = new EventEmitter<GanttChartConfig>();

  public currentMode$ = new BehaviorSubject<GanttChartMode>(GanttChartMode.Day);
  public tasks$: Observable<GanttChartTask[]>;
  public dataSubject = new BehaviorSubject<Data>(null);

  public ngOnInit() {
    this.tasks$ = this.subscribeTasks$();
  }

  private subscribeTasks$(): Observable<GanttChartTask[]> {
    return this.dataSubject.pipe(
      filter(data => !!data),
      debounceTime(100),
      map(data => createGanttChartTasks(data.config, data.collections, data.documents, data.permissions || {}))
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.documents || changes.config || changes.collections || changes.permissions) && this.config) {
      this.dataSubject.next({
        documents: this.documents,
        collections: this.collections,
        permissions: this.permissions,
        config: this.config,
      });
    }
    if (changes.config && this.config) {
      this.currentMode$.next(this.config.mode);
    }
  }

  public onModeChanged(mode: GanttChartMode) {
    if (this.canManageConfig) {
      const config = {...this.config, mode};
      this.configChange.next(config);
    } else {
      this.currentMode$.next(mode);
    }
  }

  public onValueChanged(data: {documentId: string; attributeId: string; value: any}) {
    const {documentId, attributeId, value} = data;
    const changedDocument = this.documents.find(document => document.id === documentId);
    if (!changedDocument) {
      return;
    }

    const patchDocument = {...changedDocument, data: {[attributeId]: value}};
    this.patchData.emit(patchDocument);
  }
}
