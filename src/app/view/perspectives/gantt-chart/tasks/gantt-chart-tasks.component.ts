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
import {
  GanttChartBarPropertyOptional,
  GanttChartConfig,
  GanttChartMode,
  GanttChartTask,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {BehaviorSubject, Observable} from 'rxjs';
import {debounceTime, filter, map} from 'rxjs/operators';
import {createGanttChartTasks} from '../util/gantt-chart-util';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {isNotNullOrUndefined, isNumeric} from '../../../../shared/utils/common.utils';
import {getSaveValue} from '../../../../shared/utils/data.utils';

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

  public currentMode$ = new BehaviorSubject<GanttChartMode>(GanttChartMode.Month);
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

  public onValueChanged(data: {documentId: string; changes: {attributeId: string; value: any}[]}) {
    const {documentId, changes} = data;
    const changedDocument = this.documents.find(document => document.id === documentId);
    if (!changedDocument) {
      return;
    }

    const collection = (this.collections || []).find(c => c.id === changedDocument.collectionId);

    const patchData = {};
    for (const {attributeId, value} of changes) {
      const attribute = ((collection && collection.attributes) || []).find(a => a.id === attributeId);
      const saveValue = getSaveValue(value, attribute && attribute.constraint);

      const changed = (changedDocument.data && changedDocument.data[attributeId] !== saveValue) || false;
      if (changed) {
        patchData[attributeId] =
          attribute && attribute.constraint ? saveValue : this.formatNewValue(changedDocument, attributeId, value);
      }
    }

    if (Object.keys(patchData).length > 0) {
      this.patchData.emit({...changedDocument, data: patchData});
    }
  }

  private formatNewValue(document: DocumentModel, attributeId: string, value: any): any {
    if (this.isProgressAttribute(document.collectionId, attributeId)) {
      const currentProgress = document.data[attributeId];
      if (isNotNullOrUndefined(currentProgress) && isNumeric(value) && currentProgress.toString().endsWith('%')) {
        return `${value}%`;
      }
    }
    return value;
  }

  private isProgressAttribute(collectionId: string, attributeId: string): boolean {
    const collectionConfig = this.config && this.config.collections && this.config.collections[collectionId];
    const progressAxis = collectionConfig && collectionConfig.barsProperties[GanttChartBarPropertyOptional.Progress];
    return progressAxis && progressAxis.attributeId === attributeId;
  }
}
