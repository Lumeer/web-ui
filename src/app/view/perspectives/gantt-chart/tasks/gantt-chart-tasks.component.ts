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
  ViewChild,
} from '@angular/core';
import {GanttOptions} from '@lumeer/lumeer-gantt/dist/model/options';
import {Task as GanttChartTask} from '@lumeer/lumeer-gantt/dist/model/task';
import * as moment from 'moment';
import {BehaviorSubject, Observable} from 'rxjs';
import {debounceTime, filter, map, tap} from 'rxjs/operators';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {Collection} from '../../../../core/store/collections/collection';
import {findAttributeConstraint} from '../../../../core/store/collections/collection.util';
import {DocumentMetaData, DocumentModel} from '../../../../core/store/documents/document.model';
import {generateDocumentDataByQuery} from '../../../../core/store/documents/document.utils';
import {GanttChartBarModel, GanttChartConfig, GanttChartMode} from '../../../../core/store/gantt-charts/gantt-chart';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query} from '../../../../core/store/navigation/query/query';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {
  deepObjectsEquals,
  isNotNullOrUndefined,
  isNullOrUndefined,
  isNumeric,
} from '../../../../shared/utils/common.utils';
import {GanttChartConverter, GanttTaskMetadata} from '../util/gantt-chart-converter';
import {checkOrTransformGanttConfig, createLinkDocumentsData} from '../util/gantt-chart-util';
import {ModalService} from '../../../../shared/modal/modal.service';
import {GanttChartVisualizationComponent} from './visualization/gantt-chart-visualization.component';
import {BsModalRef} from 'ngx-bootstrap';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {DateTimeConstraint} from '../../../../core/model/constraint/datetime.constraint';
import {DataValue} from '../../../../core/model/data-value';
import {ChooseLinkDocumentModalComponent} from '../../../../shared/modal/choose-link-document/choose-link-document-modal.component';

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

interface PatchData {
  dataResource: DataResource;
  resourceType: AttributesResourceType;
  data: Record<string, any>;
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
  public updateLinkDocuments = new EventEmitter<{linkInstanceId: string; documentIds: [string, string]}>();

  @Output()
  public patchMetaData = new EventEmitter<{collectionId: string; documentId: string; metaData: DocumentMetaData}>();

  @Output()
  public configChange = new EventEmitter<GanttChartConfig>();

  @Output()
  public createDocument = new EventEmitter<DocumentModel>();

  @ViewChild(GanttChartVisualizationComponent, {static: false})
  public ganttChartVisualizationComponent: GanttChartVisualizationComponent;

  private readonly converter: GanttChartConverter;
  private readonly newTaskName: string;

  private options: GanttOptions;
  private tasks: GanttChartTask[];

  public currentMode$ = new BehaviorSubject<GanttChartMode>(GanttChartMode.Month);
  public data$: Observable<{options: GanttOptions; tasks: GanttChartTask[]}>;
  public dataSubject = new BehaviorSubject<Data>(null);

  constructor(
    private selectItemWithConstraintFormatter: SelectItemWithConstraintFormatter,
    private modalService: ModalService,
    private i18n: I18n
  ) {
    this.converter = new GanttChartConverter(this.selectItemWithConstraintFormatter);
    this.newTaskName = i18n({id: 'gantt.perspective.task.create.title', value: 'New task'});
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
      tap(data => {
        this.options = data.options;
        this.tasks = data.tasks;
      })
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
    const patchData = this.createPatchData(task);
    for (const item of patchData) {
      this.emitPatchData(item.data, item.resourceType, item.dataResource);
    }

    if (someLinkSwimlaneChanged(task)) {
      this.patchCategoryLink(task);
    }
  }

  private createPatchData(task: GanttChartTask): PatchData[] {
    const metadata = task.metadata as GanttTaskMetadata;
    const stemConfig = metadata.stemConfig;
    const patchData: PatchData[] = [];

    if (stemConfig.start) {
      const dataResource = this.getDataResource(metadata.startDataId, stemConfig.start.resourceType);
      if (dataResource) {
        const data = this.getPatchData(patchData, dataResource, stemConfig.start);
        this.patchDate(task.start, stemConfig.start, data, dataResource);
      }
    }

    if (stemConfig.end) {
      const dataResource = this.getDataResource(metadata.endDataId, stemConfig.end.resourceType);
      if (dataResource) {
        const data = this.getPatchData(patchData, dataResource, stemConfig.end);
        this.patchDate(task.end, stemConfig.end, data, dataResource);
      }
    }

    // edit of computed progress is currently not supported
    if (stemConfig.progress && (metadata.progressDataIds || []).length === 1) {
      const dataResource = this.getDataResource(metadata.progressDataIds[0], stemConfig.progress.resourceType);
      if (dataResource) {
        const data = this.getPatchData(patchData, dataResource, stemConfig.progress);
        this.patchProgress(task.progress, stemConfig.progress, data, dataResource);
      }
    }

    if (stemConfig.name || stemConfig.start) {
      const taskModel = stemConfig.name || stemConfig.start;
      for (let i = 0; i < (metadata.stemConfig.categories || []).length; i++) {
        const category = metadata.stemConfig.categories[i];
        if (modelsAreFromSameOrNearResource(taskModel, category)) {
          const dataResource = this.getDataResource(metadata.swimlanesDataResourcesIds[i], category.resourceType);
          if (dataResource) {
            const data = this.getPatchData(patchData, dataResource, category);
            this.patchCategory(task.swimlanes[i].value || task.swimlanes[i].title, category, data, dataResource);
          }
        }
      }
    }

    return patchData;
  }

  private patchCategoryLink(task: GanttChartTask) {
    const {linkInstanceId, documentId, otherDocumentIds} = createLinkDocumentsData(
      task,
      this.tasks,
      this.linkInstances
    );

    if (linkInstanceId && documentId && (otherDocumentIds || []).length > 0) {
      if (otherDocumentIds.length === 1) {
        this.updateLinkDocuments.emit({linkInstanceId, documentIds: [documentId, otherDocumentIds[0]]});
      } else {
        const callback = selectedDocument =>
          this.updateLinkDocuments.emit({
            linkInstanceId,
            documentIds: [documentId, selectedDocument.id],
          });
        const config = {initialState: {documentIds: otherDocumentIds, callback}, keyboard: true, class: 'modal-lg'};
        this.modalService.show(ChooseLinkDocumentModalComponent, config);
      }
    }
  }

  private patchCategory(
    swimlane: any,
    model: GanttChartBarModel,
    patchData: Record<string, any>,
    dataResource: DataResource
  ) {
    const resource = this.getResource(dataResource, model.resourceType);
    const constraint = findAttributeConstraint(resource && resource.attributes, model.attributeId);
    const saveValue = constraint ? constraint.createDataValue(swimlane, this.constraintData).serialize() : swimlane;

    const changed = (dataResource.data && dataResource.data[model.attributeId] !== saveValue) || false;
    if (changed) {
      patchData[model.attributeId] = saveValue;
    }
  }

  private getPatchData(
    patchDataArray: PatchData[],
    dataResource: DataResource,
    model: GanttChartBarModel
  ): Record<string, any> {
    const patchDataObject = patchDataArray.find(
      patchData => patchData.dataResource.id === dataResource.id && patchData.resourceType === model.resourceType
    );
    if (patchDataObject) {
      return patchDataObject.data;
    }

    const data = {};
    patchDataArray.push({data, resourceType: model.resourceType, dataResource});
    return data;
  }

  private patchDate(
    date: string,
    model: GanttChartBarModel,
    patchData: Record<string, any>,
    dataResource: DataResource
  ) {
    const end = moment(date, this.options && this.options.dateFormat);
    const resource = this.getResource(dataResource, model.resourceType);
    const constraint =
      findAttributeConstraint(resource && resource.attributes, model.attributeId) ||
      new DateTimeConstraint({format: this.options && this.options.dateFormat});
    const dataValue: DataValue = constraint.createDataValue(end.toDate(), this.constraintData);
    if (!dataResource || dataValue.compareTo(constraint.createDataValue(dataResource.data[model.attributeId])) !== 0) {
      patchData[model.attributeId] = dataValue.serialize();
    }
  }

  private patchProgress(
    progress: number,
    model: GanttChartBarModel,
    patchData: Record<string, any>,
    dataResource: DataResource
  ) {
    const resource = this.getResource(dataResource, model.resourceType);
    const constraint = findAttributeConstraint(resource && resource.attributes, model.attributeId);
    const saveValue = constraint
      ? constraint
          .createDataValue(progress, this.constraintData)
          .parseInput(String(progress || 0))
          .serialize()
      : this.formatPercentage(dataResource, model.attributeId, progress);
    if (!dataResource || saveValue !== dataResource.data[model.attributeId]) {
      patchData[model.attributeId] = saveValue;
    }
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
      return (this.linkInstances || []).find(linkInstance => linkInstance.id === id);
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
    const stemConfig = this.config.stemsConfigs && this.config.stemsConfigs[0]; // we support creating tasks only in this situation
    if (!stemConfig || !stemConfig.stem) {
      return;
    }

    const data = generateDocumentDataByQuery(this.query, this.collections, this.constraintData, false);
    const document: DocumentModel = {collectionId: stemConfig.stem.collectionId, data, id: null};

    this.patchDate(task.start, stemConfig.start, data, document);
    this.patchDate(task.end, stemConfig.end, data, document);

    if (stemConfig.name && isNullOrUndefined(data[stemConfig.name.attributeId])) {
      data[stemConfig.name.attributeId] = this.newTaskName;
    }

    const modalRef = this.openDocumentDetailModal(document);
    modalRef.content.onCancel$.subscribe(() => this.ganttChartVisualizationComponent.removeTask(task));
  }

  public onTaskDetail(task: GanttChartTask) {
    const metadata = task.metadata as GanttTaskMetadata;
    const resourceType = metadata.stemConfig.name && metadata.stemConfig.name.resourceType;
    if (resourceType !== AttributesResourceType.Collection) {
      return; // links are currently not supported in detail dialog
    }
    const document = this.getDataResource(metadata.nameDataId, resourceType);
    if (document) {
      this.openDocumentDetailModal(document as DocumentModel);
    }
  }

  private openDocumentDetailModal(document: DocumentModel): BsModalRef {
    const collection = this.getResource(document, AttributesResourceType.Collection);
    return this.modalService.showDocumentDetail(document, collection);
  }
}

function modelsAreFromSameOrNearResource(model1: GanttChartBarModel, model2: GanttChartBarModel): boolean {
  return modelsAreFromSameResource(model1, model2) || modelsAreFromNearResource(model1, model2);
}

function modelsAreFromSameResource(model1: GanttChartBarModel, model2: GanttChartBarModel): boolean {
  return model1.resourceIndex === model2.resourceIndex;
}

function modelsAreFromNearResource(model1: GanttChartBarModel, model2: GanttChartBarModel): boolean {
  if (
    model2.resourceType === AttributesResourceType.Collection &&
    model1.resourceType === AttributesResourceType.LinkType &&
    model2.resourceIndex === model1.resourceIndex + 1
  ) {
    return true;
  }

  if (
    model2.resourceType === AttributesResourceType.LinkType &&
    model1.resourceType === AttributesResourceType.Collection &&
    model2.resourceIndex === model1.resourceIndex - 1
  ) {
    return true;
  }

  return false;
}

function someLinkSwimlaneChanged(task: GanttChartTask): boolean {
  const metadata = task.metadata as GanttTaskMetadata;
  const taskModel = metadata.stemConfig.name || metadata.stemConfig.start;
  if (!taskModel) {
    return false;
  }

  return task.metadata.swimlanes.some((swimlane, index) => {
    if (task.swimlanes[index].value !== swimlane.value) {
      return !modelsAreFromSameOrNearResource(taskModel, metadata.stemConfig.categories[index]);
    }

    return false;
  });
}
