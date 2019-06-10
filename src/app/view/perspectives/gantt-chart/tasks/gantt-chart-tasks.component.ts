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
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentMetaData, DocumentModel} from '../../../../core/store/documents/document.model';
import {
  GanttChartBarPropertyOptional,
  GanttChartConfig,
  GanttChartMode,
  GanttChartTask,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {BehaviorSubject, Observable} from 'rxjs';
import {debounceTime, filter, map} from 'rxjs/operators';
import {GanttChartConverter} from '../util/gantt-chart-util';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {isNotNullOrUndefined, isNumeric} from '../../../../shared/utils/common.utils';
import {getSaveValue} from '../../../../shared/utils/data.utils';
import {Query} from '../../../../core/store/navigation/query';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {findAttributeConstraint} from '../../../../core/store/collections/collection.util';

interface Data {
  collections: Collection[];
  documents: DocumentModel[];
  linkTypes: LinkType[];
  linkInstances: LinkInstance[];
  config: GanttChartConfig;
  permissions: Record<string, AllowedPermissions>;
  query: Query;
  constraintData: ConstraintData;
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
  public linkTypes: LinkType[];

  @Input()
  public linkInstances: LinkInstance[];

  @Input()
  public config: GanttChartConfig;

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public ganttChartId: string;

  @Input()
  public query: Query;

  @Output()
  public patchDocumentData = new EventEmitter<DocumentModel>();

  @Output()
  public patchLinkData = new EventEmitter<LinkInstance>();

  @Output()
  public patchMetaData = new EventEmitter<{collectionId: string; documentId: string; metaData: DocumentMetaData}>();

  @Output()
  public configChange = new EventEmitter<GanttChartConfig>();

  private converter = new GanttChartConverter();

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
      map(data =>
        this.converter.convert(
          data.config,
          data.collections,
          data.documents,
          data.linkTypes,
          data.linkInstances,
          data.permissions || {},
          data.constraintData,
          data.query
        )
      )
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (
      (changes.documents ||
        changes.config ||
        changes.collections ||
        changes.permissions ||
        changes.linkTypes ||
        changes.linkInstances ||
        changes.query ||
        changes.constraintData) &&
      this.config
    ) {
      this.dataSubject.next({
        collections: this.collections,
        documents: this.documents,
        linkTypes: this.linkTypes,
        linkInstances: this.linkInstances,
        permissions: this.permissions,
        config: this.config,
        query: this.query,
        constraintData: this.constraintData,
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

  public onValueChanged(data: {
    dataResourceId: string;
    collectionConfigId: string;
    type: AttributesResourceType;
    changes: {attributeId: string; value: any}[];
  }) {
    const {dataResourceId, collectionConfigId, type, changes} = data;
    const dataResource = this.getDataResource(dataResourceId, type);
    if (!dataResource) {
      return;
    }

    const resource = this.getResource(dataResource, type);

    const patchData = {};
    for (const {attributeId, value} of changes) {
      const constraint = findAttributeConstraint(resource && resource.attributes, attributeId);
      const saveValue = constraint
        ? getSaveValue(value, constraint)
        : this.formatNewValue(dataResource, collectionConfigId, attributeId, value);

      const changed = (dataResource.data && dataResource.data[attributeId] !== saveValue) || false;
      if (changed) {
        patchData[attributeId] = saveValue;
      }
    }

    if (Object.keys(patchData).length > 0) {
      if (type === AttributesResourceType.Collection) {
        this.patchDocumentData.emit({...(<DocumentModel>dataResource), data: patchData});
      } else if (type === AttributesResourceType.LinkType) {
        this.patchLinkData.emit({...(<LinkInstance>dataResource), data: patchData});
      }
    }
  }

  private getDataResource(id: string, type: AttributesResourceType): DataResource {
    if (type === AttributesResourceType.Collection) {
      return (this.documents || []).find(document => document.id === id);
    } else if (type === AttributesResourceType.LinkType) {
      return (this.linkInstances || []).find(linkInstanec => linkInstanec.id === id);
    }

    return null;
  }

  private getResource(dataResource: DataResource, type: AttributesResourceType): AttributesResource {
    if (type === AttributesResourceType.Collection) {
      return (this.collections || []).find(c => c.id === (dataResource as DocumentModel).collectionId);
    } else if (type === AttributesResourceType.LinkType) {
      return (this.linkTypes || []).find(lt => lt.id === (dataResource as LinkInstance).linkTypeId);
    }
    return null;
  }

  private formatNewValue(dataResource: DataResource, collectionConfigId: string, attributeId: string, value: any): any {
    if (this.isProgressAttribute(collectionConfigId, attributeId)) {
      const currentProgress = dataResource.data[attributeId];
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

  public onAddDependency(data: {fromId: string; toId: string}) {
    const documentFrom = (this.documents || []).find(document => document.id === data.fromId);
    const documentTo = (this.documents || []).find(document => document.id === data.toId);
    if (!documentFrom || !documentTo) {
      return;
    }

    const metaData = {parentId: documentFrom.id};
    this.patchMetaData.emit({collectionId: documentTo.collectionId, documentId: documentTo.id, metaData});
  }

  public onRemoveDependency(data: {fromId: string; toId: string}) {
    const documentFrom = (this.documents || []).find(document => document.id === data.fromId);
    const documentTo = (this.documents || []).find(document => document.id === data.toId);
    if (!documentFrom || !documentTo) {
      return;
    }

    const metaData = {parentId: null};
    this.patchMetaData.emit({collectionId: documentTo.collectionId, documentId: documentTo.id, metaData});
  }
}
