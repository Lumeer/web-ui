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
  SimpleChange,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import {GanttOptions, GanttTask} from '@lumeer/lumeer-gantt';
import * as moment from 'moment';
import {BehaviorSubject, Observable} from 'rxjs';
import {debounceTime, filter, map, tap} from 'rxjs/operators';
import {ResourcesPermissions} from '../../../../core/model/allowed-permissions';
import {AttributesResource, AttributesResourceType, DataResource} from '../../../../core/model/resource';
import {Collection} from '../../../../core/store/collections/collection';
import {findAttributeConstraint} from '../../../../core/store/collections/collection.util';
import {DocumentMetaData, DocumentModel} from '../../../../core/store/documents/document.model';
import {
  GanttChartBarModel,
  GanttChartConfig,
  GanttChartMode,
  GanttChartStemConfig,
} from '../../../../core/store/gantt-charts/gantt-chart';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query} from '../../../../core/store/navigation/query/query';
import {SelectItemWithConstraintFormatter} from '../../../../shared/select/select-constraint-item/select-item-with-constraint-formatter.service';
import {deepObjectsEquals, isNotNullOrUndefined, isNumeric, toNumber} from '../../../../shared/utils/common.utils';
import {GanttChartConverter, GanttTaskMetadata} from '../util/gantt-chart-converter';
import {
  canCreateTaskByStemConfig,
  checkOrTransformGanttConfig,
  ganttModelsAreFromSameOrNearResource,
  isGanttConfigChanged,
  tasksHasSameSwimlanes,
} from '../util/gantt-chart-util';
import {ModalService} from '../../../../shared/modal/modal.service';
import {GanttChartVisualizationComponent} from './visualization/gantt-chart-visualization.component';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {constraintContainsHoursInConfig, subtractDatesToDurationCountsMap} from '../../../../shared/utils/date.utils';
import {
  ConstraintData,
  ConstraintType,
  DataValue,
  DateTimeConstraint,
  DocumentsAndLinksData,
  DurationConstraint,
  durationCountsMapToString,
} from '@lumeer/data-filters';
import {ConfigurationService} from '../../../../configuration/configuration.service';
import {View, ViewSettings} from '../../../../core/store/views/view';
import {GanttPerspectiveConfiguration} from '../../perspective-configuration';
import {
  CreateDataResourceDataGrouping,
  CreateDataResourceService,
} from '../../../../core/service/create-data-resource.service';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {DataResourceChain} from '../../../../shared/utils/data/data-aggregator';

interface Data {
  collections: Collection[];
  data: DocumentsAndLinksData;
  linkTypes: LinkType[];
  config: GanttChartConfig;
  permissions: ResourcesPermissions;
  query: Query;
  constraintData: ConstraintData;
  settings: ViewSettings;
}

interface PatchData {
  dataResource: DataResource;
  resourceType: AttributesResourceType;
  data: Record<string, any>;
}

type PatchDataMap = Record<string, Record<string, any>>;

@Component({
  selector: 'gantt-chart-tasks',
  styleUrls: ['./gantt-chart-tasks.component.scss'],
  templateUrl: './gantt-chart-tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartTasksComponent implements OnInit, OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public data: DocumentsAndLinksData;

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public config: GanttChartConfig;

  @Input()
  public permissions: ResourcesPermissions;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public ganttChartId: string;

  @Input()
  public query: Query;

  @Input()
  public view: View;

  @Input()
  public dataLoaded: boolean;

  @Input()
  public settings: ViewSettings;

  @Input()
  public workspace: Workspace;

  @Input()
  public perspectiveConfiguration: GanttPerspectiveConfiguration;

  @Output()
  public patchDocumentData = new EventEmitter<DocumentModel>();

  @Output()
  public patchLinkData = new EventEmitter<LinkInstance>();

  @Output()
  public patchMetaData = new EventEmitter<{collectionId: string; documentId: string; metaData: DocumentMetaData}>();

  @Output()
  public configChange = new EventEmitter<GanttChartConfig>();

  @ViewChild(GanttChartVisualizationComponent)
  public ganttChartVisualizationComponent: GanttChartVisualizationComponent;

  private readonly converter: GanttChartConverter;
  private readonly newTaskName: string;

  private options: GanttOptions;
  private tasks: GanttTask[];

  public data$: Observable<{options: GanttOptions; tasks: GanttTask[]}>;

  private dataSubject = new BehaviorSubject<Data>(null);

  constructor(
    private selectItemWithConstraintFormatter: SelectItemWithConstraintFormatter,
    private modalService: ModalService,
    private configurationService: ConfigurationService,
    private createService: CreateDataResourceService
  ) {
    this.converter = new GanttChartConverter(
      this.selectItemWithConstraintFormatter,
      configurationService.getConfiguration()
    );
    this.newTaskName = $localize`:@@gantt.perspective.task.create.title:New task`;
  }

  public ngOnInit() {
    this.data$ = this.subscribeTasks$();
  }

  private subscribeTasks$(): Observable<{options: GanttOptions; tasks: GanttTask[]}> {
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

  private handleData(data: Data): {options: GanttOptions; tasks: GanttTask[]} {
    const config = checkOrTransformGanttConfig(data.config, data.query, data.collections, data.linkTypes);
    if (!deepObjectsEquals(config, data.config)) {
      this.configChange.emit(config);
    }

    return this.converter.convert(
      config,
      data.collections,
      data.linkTypes,
      data.data,
      data.permissions,
      data.query,
      data.settings,
      data.constraintData
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (this.shouldConvertData(changes)) {
      this.dataSubject.next({
        collections: this.collections,
        linkTypes: this.linkTypes,
        data: this.data,
        permissions: this.permissions,
        config: this.config,
        settings: this.settings,
        query: this.query,
        constraintData: this.constraintData,
      });
    }
    this.createService.setData(
      this.data,
      this.query,
      this.collections,
      this.linkTypes,
      this.constraintData,
      this.workspace
    );
  }

  private shouldConvertData(changes: SimpleChanges): boolean {
    return (
      this.dataLoaded &&
      (changes.dataLoaded ||
        changes.data ||
        changes.settings ||
        (changes.config && this.configChanged(changes.config)) ||
        changes.collections ||
        changes.permissions ||
        changes.linkTypes ||
        changes.query ||
        changes.constraintData) &&
      !!this.config
    );
  }

  private configChanged(change: SimpleChange): boolean {
    const previousConfig: GanttChartConfig = change.previousValue && {...change.previousValue};
    const currentConfig: GanttChartConfig = change.currentValue && {...change.currentValue};
    previousConfig && this.cleanGanttConfig(previousConfig);
    currentConfig && this.cleanGanttConfig(currentConfig);

    return isGanttConfigChanged(previousConfig, currentConfig);
  }

  private cleanGanttConfig(config: GanttChartConfig) {
    delete config.position;
    delete config.positionSaved;
    delete config.swimlaneWidths;
  }

  public onModeChanged(mode: GanttChartMode) {
    const config = {...this.config, mode};
    this.configChange.next(config);
  }

  public onTaskChanged(task: GanttTask) {
    const patchData = this.createPatchData(task);
    for (const item of patchData) {
      this.emitPatchData(item.data, item.resourceType, item.dataResource);
    }

    if (someLinkSwimlaneChanged(task)) {
      this.patchTaskCategories(task);
    }
  }

  private createPatchData(task: GanttTask): PatchData[] {
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
        this.patchEndDate(task, stemConfig.end, data, dataResource);
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
        if (ganttModelsAreFromSameOrNearResource(taskModel, category)) {
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

  public createTask(task: GanttTask) {
    const stemsConfigs = (this.config.stemsConfigs || []).filter(config =>
      canCreateTaskByStemConfig(config, this.permissions)
    );
    this.createService.chooseStemConfig(
      stemsConfigs,
      stemConfig => {
        const grouping = this.createDataResourceDataGrouping(task, stemConfig);
        const dataResourcesChains = this.taskDataResourcesChains(task);
        const patchDataMap = this.createPatchDataMapNewTask(task, stemConfig);

        this.createService.create({
          queryResource: stemConfig.name || stemConfig.start,
          stem: stemConfig.stem,
          grouping,
          dataResourcesChains,
          data: patchDataMap,
          failureMessage: $localize`:@@perspective.gantt.create.task.failure:Could not create task`,
          onCancel: () => this.ganttChartVisualizationComponent?.removeTask(task),
        });
      },
      () => this.ganttChartVisualizationComponent?.removeTask(task)
    );
  }

  private patchTaskCategories(task: GanttTask) {
    const metadata = <GanttTaskMetadata>task.metadata;
    const stemConfig = metadata.stemConfig;
    const grouping = this.createDataResourceDataGrouping(task, stemConfig);
    const dataResourcesChains = this.taskDataResourcesChains(task);
    const patchDataMap = this.createPatchDataMapNewTask(task, stemConfig);
    this.createService.update({
      queryResource: stemConfig.name || stemConfig.start,
      stem: stemConfig.stem,
      grouping,
      dataResourcesChains,
      data: patchDataMap,
      dataResource: metadata.dataResource,
      dataResourceChain: metadata.dataResourceChain,
      previousValue: task.swimlanes?.[0]?.value,
      newValue: metadata.swimlanes?.[0]?.value,
      attributeId: stemConfig.categories?.[0]?.attributeId,
      failureMessage: $localize`:@@perspective.gantt.move.task.failure:Could not move task`,
    });
  }

  private createDataResourceDataGrouping(
    task: GanttTask,
    stemConfig: GanttChartStemConfig
  ): CreateDataResourceDataGrouping[] {
    return task.swimlanes
      .map((swimlane, index) => ({value: swimlane.value, attribute: stemConfig.categories?.[index]}))
      .filter(group => !!group.attribute);
  }

  private taskDataResourcesChains(task: GanttTask): DataResourceChain[][] {
    return (this.tasks || [])
      .filter(otherTask => tasksHasSameSwimlanes(otherTask, task))
      .map(otherTask => (<GanttTaskMetadata>otherTask.metadata).dataResourceChain);
  }

  private patchCategory(
    swimlane: any,
    model: GanttChartBarModel,
    patchData: Record<string, any>,
    dataResource: DataResource
  ) {
    const resource = this.getResourceById(model.resourceId, model.resourceType);
    const constraint = findAttributeConstraint(resource.attributes, model.attributeId);
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

  private patchEndDate(
    task: GanttTask,
    model: GanttChartBarModel,
    patchData: Record<string, any>,
    dataResource: DataResource = null
  ) {
    const resource = this.getResourceById(model.resourceId, model.resourceType);
    const constraint = findAttributeConstraint(resource.attributes, model.attributeId);
    if (constraint?.type === ConstraintType.Duration) {
      const start = moment(task.start, this.options?.dateFormat);
      const end = moment(task.end, this.options?.dateFormat);

      const durationCountsMap = subtractDatesToDurationCountsMap(end.toDate(), start.toDate());
      const durationString = durationCountsMapToString(durationCountsMap);
      const dataValue = (<DurationConstraint>constraint).createDataValue(durationString, this.constraintData);

      patchData[model.attributeId] = toNumber(dataValue.serialize());
    } else {
      this.patchDate(task.end, model, patchData, dataResource, true);
    }
  }

  private patchDate(
    dateString: string,
    model: GanttChartBarModel,
    patchData: Record<string, any>,
    dataResource: DataResource = null,
    subtractDay?: boolean
  ) {
    let momentDate = moment(dateString, this.options?.dateFormat);
    const resource = this.getResourceById(model.resourceId, model.resourceType);
    const constraint =
      findAttributeConstraint(resource.attributes, model.attributeId) ||
      new DateTimeConstraint({format: this.options?.dateFormat});
    if (!constraintContainsHoursInConfig(constraint)) {
      momentDate = momentDate.startOf('day');
      if (subtractDay) {
        momentDate = momentDate.subtract(1, 'days');
      }
    }

    const dataValue: DataValue = constraint.createDataValue(momentDate.toDate(), this.constraintData);

    if (!dataResource || dataValue.compareTo(constraint.createDataValue(dataResource.data[model.attributeId])) !== 0) {
      patchData[model.attributeId] = dataValue.serialize();
    }
  }

  private patchProgress(
    progress: number,
    model: GanttChartBarModel,
    patchData: Record<string, any>,
    dataResource: DataResource = null
  ) {
    const resource = this.getResourceById(model.resourceId, model.resourceType);
    const constraint = findAttributeConstraint(resource.attributes, model.attributeId);
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
      return (this.data?.uniqueDocuments || []).find(document => document.id === id);
    } else if (type === AttributesResourceType.LinkType) {
      return (this.data?.uniqueLinkInstances || []).find(linkInstance => linkInstance.id === id);
    }

    return null;
  }

  private getResourceById(id: string, type: AttributesResourceType): AttributesResource {
    if (type === AttributesResourceType.Collection) {
      return (this.collections || []).find(c => c.id === id);
    } else if (type === AttributesResourceType.LinkType) {
      return (this.linkTypes || []).find(lt => lt.id === id);
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
    const documentFrom = (this.data?.uniqueDocuments || []).find(document => document.id === data.fromId);
    const documentTo = (this.data?.uniqueDocuments || []).find(document => document.id === data.toId);
    if (!documentFrom || !documentTo) {
      return;
    }

    const metaData = {parentId: documentFrom.id};
    this.patchMetaData.emit({collectionId: documentTo.collectionId, documentId: documentTo.id, metaData});
  }

  public onRemoveDependency(data: {fromId: string; toId: string}) {
    const documentFrom = (this.data?.uniqueDocuments || []).find(document => document.id === data.fromId);
    const documentTo = (this.data?.uniqueDocuments || []).find(document => document.id === data.toId);
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

  private createPatchDataMapNewTask(task: GanttTask, stemConfig: GanttChartStemConfig): PatchDataMap {
    const patchDataMap: PatchDataMap = {};

    if (stemConfig.name) {
      patchDataMap[stemConfig.name.resourceId] = {[stemConfig.name.attributeId]: this.newTaskName};
    }

    if (!patchDataMap[stemConfig.start.resourceId]) {
      patchDataMap[stemConfig.start.resourceId] = {};
    }
    this.patchDate(task.start, stemConfig.start, patchDataMap[stemConfig.start.resourceId]);

    if (!patchDataMap[stemConfig.end.resourceId]) {
      patchDataMap[stemConfig.end.resourceId] = {};
    }
    this.patchEndDate(task, stemConfig.end, patchDataMap[stemConfig.end.resourceId]);

    (stemConfig.categories || []).forEach((category, index) => {
      if (!patchDataMap[category.resourceId]) {
        patchDataMap[category.resourceId] = {};
      }
      const patchData = patchDataMap[category.resourceId];
      if (!patchData[category.attributeId]) {
        const swimlane = task.swimlanes[index];
        if (swimlane) {
          patchData[category.attributeId] = swimlane.value;
        }
      }
    });

    return patchDataMap;
  }

  public onTaskDetail(task: GanttTask) {
    const metadata = task.metadata as GanttTaskMetadata;
    if (metadata) {
      const resourceType = metadata.stemConfig.name?.resourceType || metadata.stemConfig.start?.resourceType;
      const dataResource = this.getDataResource(metadata.nameDataId || metadata.startDataId, resourceType);
      if (dataResource) {
        this.openDataResourceModal(dataResource, resourceType);
      }
    }
  }

  private openDataResourceModal(dataResource: DataResource, resourceType: AttributesResourceType): BsModalRef {
    const resourceId = (<DocumentModel>dataResource).collectionId || (<LinkInstance>dataResource).linkTypeId;
    const resource = this.getResourceById(resourceId, resourceType);
    if (resource) {
      return this.modalService.showDataResourceDetail(dataResource, resource, this.view?.id);
    }
  }

  public onPositionChanged(value: number) {
    const newConfig = {...this.config, position: {value}};
    this.configChange.emit(newConfig);
  }
}

function someLinkSwimlaneChanged(task: GanttTask): boolean {
  const metadata = task.metadata as GanttTaskMetadata;
  const taskModel = metadata.stemConfig.name || metadata.stemConfig.start;
  if (!taskModel) {
    return false;
  }

  return task.metadata.swimlanes.some((swimlane, index) => {
    if (task.swimlanes[index].value !== swimlane.value) {
      return !ganttModelsAreFromSameOrNearResource(taskModel, metadata.stemConfig.categories[index]);
    }

    return false;
  });
}
