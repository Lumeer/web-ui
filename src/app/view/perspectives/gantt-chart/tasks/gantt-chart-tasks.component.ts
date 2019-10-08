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
import {GanttOptions} from '@lumeer/lumeer-gantt/dist/model/options';
import {Task as GanttChartTask} from '@lumeer/lumeer-gantt/dist/model/task';
import * as moment from 'moment';
import {BsModalService} from 'ngx-bootstrap';
import {BehaviorSubject, Observable} from 'rxjs';
import {debounceTime, filter, map, tap} from 'rxjs/operators';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {Collection} from '../../../../core/store/collections/collection';
import {findAttributeConstraint} from '../../../../core/store/collections/collection.util';
import {DocumentMetaData, DocumentModel} from '../../../../core/store/documents/document.model';
import {generateDocumentDataByQuery} from '../../../../core/store/documents/document.utils';
import {GanttChartConfig, GanttChartMode} from '../../../../core/store/gantt-charts/gantt-chart';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query} from '../../../../core/store/navigation/query/query';
import {User} from '../../../../core/store/users/user';
import {DetailDialogComponent} from '../../../../shared/detail-dialog/detail-dialog.component';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {deepObjectsEquals, isNotNullOrUndefined, isNumeric} from '../../../../shared/utils/common.utils';
import {GanttChartConverter, GanttChartTaskMetadata} from '../util/gantt-chart-converter';
import {checkOrTransformGanttConfig} from '../util/gantt-chart-util';

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

  @Input()
  public currentUser: User;

  @Output()
  public patchDocumentData = new EventEmitter<DocumentModel>();

  @Output()
  public patchLinkData = new EventEmitter<LinkInstance>();

  @Output()
  public patchMetaData = new EventEmitter<{collectionId: string; documentId: string; metaData: DocumentMetaData}>();

  @Output()
  public configChange = new EventEmitter<GanttChartConfig>();

  @Output()
  public createDocument = new EventEmitter<DocumentModel>();

  private readonly converter: GanttChartConverter;

  private options: GanttOptions;

  public currentMode$ = new BehaviorSubject<GanttChartMode>(GanttChartMode.Month);
  public data$: Observable<{options: GanttOptions; tasks: GanttChartTask[]}>;
  public dataSubject = new BehaviorSubject<Data>(null);

  constructor(
    private selectItemWithConstraintFormatter: SelectItemWithConstraintFormatter,
    private modalService: BsModalService
  ) {
    this.converter = new GanttChartConverter(this.selectItemWithConstraintFormatter);
  }

  public ngOnInit() {
    this.data$ = this.subscribeTasks$();
    if (this.config) {
      this.currentMode$.next(this.config.mode);
    }
  }

  private subscribeTasks$(): Observable<{options: GanttOptions; tasks: GanttChartTask[]}> {
    return this.dataSubject.pipe(
      filter(data => !!data),
      debounceTime(100),
      map(data => this.handleData(data)),
      tap(data => (this.options = data.options))
    );
  }

  private handleData(data: Data): {options: GanttOptions; tasks: GanttChartTask[]} {
    const config = checkOrTransformGanttConfig(data.config, data.query, data.collections, data.linkTypes);
    if (!deepObjectsEquals(config, data.config)) {
      this.configChange.emit(config);
    }

    return this.converter.convert(
      config,
      data.collections,
      data.documents,
      data.linkTypes,
      data.linkInstances,
      data.permissions || {},
      data.constraintData,
      data.query
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.shouldConvertData(changes)) {
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
  }

  private shouldConvertData(changes: SimpleChanges): boolean {
    return (
      (changes.documents ||
        changes.config ||
        changes.collections ||
        changes.permissions ||
        changes.linkTypes ||
        changes.linkInstances ||
        changes.query ||
        changes.constraintData) &&
      !!this.config
    );
  }

  public onModeChanged(mode: GanttChartMode) {
    if (this.canManageConfig) {
      const config = {...this.config, mode};
      this.configChange.next(config);
    } else {
      this.currentMode$.next(mode);
    }
  }

  public onTaskChanged(task: GanttChartTask) {
    const metadata = task.metadata as GanttChartTaskMetadata;
    const dataResource = this.getDataResource(metadata.dataResourceId, metadata.resourceType);
    if (!dataResource) {
      return;
    }

    const patchData = this.createTaskPatchData(task, dataResource);
    this.emitPatchData(patchData, metadata.resourceType, dataResource);
  }

  private createTaskPatchData(task: GanttChartTask, dataResource: DataResource): Record<string, any> {
    const metadata = task.metadata as GanttChartTaskMetadata;
    const resource = this.getResource(dataResource, metadata.resourceType);
    const patchData = {};

    if (metadata.startAttributeId) {
      const start = moment(task.start, this.options && this.options.dateFormat);
      const constraint = findAttributeConstraint(resource && resource.attributes, metadata.startAttributeId);
      const saveValue = constraint
        ? constraint.createDataValue(start, this.constraintData).serialize()
        : start.toISOString();
      if (saveValue !== dataResource[metadata.startAttributeId]) {
        patchData[metadata.startAttributeId] = saveValue;
      }
    }

    if (metadata.endAttributeId) {
      const end = moment(task.end, this.options && this.options.dateFormat);
      const constraint = findAttributeConstraint(resource && resource.attributes, metadata.endAttributeId);
      const saveValue = constraint
        ? constraint.createDataValue(end, this.constraintData).serialize()
        : end.toISOString();
      if (saveValue !== dataResource[metadata.endAttributeId]) {
        patchData[metadata.endAttributeId] = saveValue;
      }
    }

    if (metadata.progressAttributeId) {
      const constraint = findAttributeConstraint(resource && resource.attributes, metadata.progressAttributeId);
      const saveValue = constraint
        ? constraint.createDataValue(task.progress, this.constraintData).serialize()
        : this.formatPercentage(dataResource, metadata.progressAttributeId, task.progress);
      if (saveValue !== dataResource[metadata.progressAttributeId]) {
        patchData[metadata.progressAttributeId] = saveValue;
      }
    }

    const stemConfig = this.config.stemsConfigs && this.config.stemsConfigs[0]; // we support drag swimlanes only in this situation
    if (task.swimlanes && stemConfig) {
      for (let i = 0; i < (stemConfig.categories || []).length; i++) {
        const category = stemConfig.categories[i];

        const constraint = findAttributeConstraint(resource && resource.attributes, category.attributeId);
        const saveValue = constraint
          ? constraint.createDataValue(task.swimlanes[i], this.constraintData).serialize()
          : task.swimlanes[i];

        const changed = (dataResource.data && dataResource.data[category.attributeId] !== saveValue) || false;
        if (changed) {
          patchData[category.attributeId] = saveValue;
        }
      }
    }

    return patchData;
  }

  private emitPatchData(
    patchData: Record<string, any>,
    resourceType: AttributesResourceType,
    dataResource: DataResource
  ) {
    if (Object.keys(patchData).length > 0) {
      if (resourceType === AttributesResourceType.Collection) {
        this.patchDocumentData.emit({...(<DocumentModel>dataResource), data: patchData});
      } else if (resourceType === AttributesResourceType.LinkType) {
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

  private formatPercentage(dataResource: DataResource, attributeId: string, value: any): any {
    const currentProgress = dataResource.data[attributeId];
    if (isNotNullOrUndefined(currentProgress) && isNumeric(value) && currentProgress.toString().endsWith('%')) {
      return `${value}%`;
    }
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

  public onSwimlaneResize(data: {index: number; width: number}) {
    if (this.canManageConfig) {
      const swimlaneWidths = [...(this.config.swimlaneWidths || [])];
      swimlaneWidths[data.index] = data.width;
      const config = {...this.config, swimlaneWidths};
      this.configChange.emit(config);
    }
  }

  public onTaskCreated(task: GanttChartTask) {
    const stemConfig = this.config.stemsConfigs && this.config.stemsConfigs[0]; // we support create tasks only in this situation
    if (!stemConfig || !stemConfig.stem) {
      return;
    }
    const document: DocumentModel = {collectionId: stemConfig.stem.collectionId, data: {}, id: null};
    const metadata: GanttChartTaskMetadata = {
      dataResourceId: document.id,
      endAttributeId: stemConfig.end && stemConfig.end.attributeId,
      progressAttributeId: stemConfig.progress && stemConfig.progress.attributeId,
      startAttributeId: stemConfig.start && stemConfig.start.attributeId,
      resourceId: document.collectionId,
      resourceType: AttributesResourceType.Collection,
    };
    const taskWithMetadata = {...task, metadata};

    const data = generateDocumentDataByQuery(this.query, this.currentUser);
    const patchData = this.createTaskPatchData(taskWithMetadata, document);
    Object.keys(patchData).forEach(key => (data[key] = patchData[key]));
    document.data = data;

    this.createDocument.emit(document);
  }

  public onTaskDetail(task: GanttChartTask) {
    const metadata = task.metadata as GanttChartTaskMetadata;
    if (metadata.resourceType !== AttributesResourceType.Collection) {
      return; // TODO support links in detail dialog
    }
    const document = this.getDataResource(metadata.dataResourceId, metadata.resourceType);
    if (!document) {
      return;
    }

    const collection = this.getResource(document, metadata.resourceType);
    const config = {initialState: {document, collection}, keyboard: true, class: 'modal-lg'};
    this.modalService.show(DetailDialogComponent, config);
  }
}
