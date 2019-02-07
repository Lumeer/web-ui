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
import {GanttChartConfig, GanttChartTask} from '../../../../core/store/gantt-charts/gantt-chart';
import {BehaviorSubject, concat, Observable, Subject} from 'rxjs';
import {debounceTime, filter, map, tap} from 'rxjs/operators';
import {createGanttChartTasks} from '../util/gantt-chart-util';

interface Data {
  collections: Collection[];
  documents: DocumentModel[];
  config: GanttChartConfig;
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
  public canManageConfig: boolean;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  public tasks$: Observable<GanttChartTask[]>;
  public dataSubject = new BehaviorSubject<Data>(null);

  public ngOnInit() {
    this.tasks$ = this.subscribeTasks$();
  }

  private subscribeTasks$(): Observable<GanttChartTask[]> {
    return this.dataSubject.pipe(
      filter(data => !!data),
      debounceTime(100),
      map(data => createGanttChartTasks(data.config, data.collections, data.documents))
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if ((changes.documents || changes.config || changes.collections) && this.config) {
      this.dataSubject.next({documents: this.documents, collections: this.collections, config: this.config});
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
