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
import {Constraint} from '../../../../core/model/constraint';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {Query} from '../../../../core/store/navigation/query/query';
import {ChartAxisType, ChartConfig} from '../../../../core/store/charts/chart';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {BehaviorSubject, Observable} from 'rxjs';
import {deepObjectCopy, deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {ChartVisualizerComponent} from './visualizer/chart-visualizer.component';
import {buffer, debounceTime, filter, map} from 'rxjs/operators';
import {ConstraintData} from '../../../../core/model/data/constraint';
import {AttributesResourceType, DataResource, Resource} from '../../../../core/model/resource';
import {checkOrTransformChartConfig} from '../visualizer/chart-util';
import {ModalService} from '../../../../shared/modal/modal.service';
import {findAttribute} from '../../../../core/store/collections/collection.util';
import {ChartData, ChartSettings} from './convertor/chart-data';
import {ChartDataConverter} from './convertor/chart-data-converter';
import {AxisSettingsChange, ClickEvent, ValueChange} from '../visualizer/chart-visualizer';
import {chartAxisChanged, chartSettingsChanged} from '../../../../core/store/charts/chart.util';

interface Data {
  collections: Collection[];
  documents: DocumentModel[];
  linkTypes: LinkType[];
  linkInstances: LinkInstance[];
  permissions: Record<string, AllowedPermissions>;
  query: Query;
  config: ChartConfig;
  updateType: UpdateType;
  constraintData: ConstraintData;
}

enum UpdateType {
  Type = 'type',
  Y1 = 'y1',
  Y2 = 'y2',
  Whole = 'whole',
}

@Component({
  selector: 'chart-data',
  templateUrl: './chart-data.component.html',
  providers: [ChartDataConverter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartDataComponent implements OnInit, OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public documents: DocumentModel[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public linkInstances: LinkInstance[];

  @Input()
  public permissions: Record<string, AllowedPermissions>;

  @Input()
  public query: Query;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public config: ChartConfig;

  @Output()
  public configChange = new EventEmitter<ChartConfig>();

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  @Output()
  public patchLinkData = new EventEmitter<LinkInstance>();

  @ViewChild(ChartVisualizerComponent, {static: true})
  public chartVisualizerComponent: ChartVisualizerComponent;

  private dataSubject = new BehaviorSubject<Data>(null);
  public chartData$: Observable<ChartData>;
  public chartSettings$ = new BehaviorSubject<ChartSettings>(null);

  constructor(private chartDataConverter: ChartDataConverter, private modalService: ModalService) {}

  public ngOnInit() {
    const closingNotifier = this.dataSubject.pipe(debounceTime(100));
    this.chartData$ = this.dataSubject.pipe(
      filter(data => !!data),
      buffer(closingNotifier),
      map(data => this.handleData(data))
    );
  }

  private handleData(data: Data[]): ChartData {
    const latestData = data[data.length - 1];
    this.updateDataForConverter(latestData);

    const newConfig = checkOrTransformChartConfig(latestData.config, this.query, this.collections, this.linkTypes);
    if (!deepObjectsEquals(newConfig, latestData.config)) {
      this.configChange.emit(newConfig);
    }

    this.handleSettingsChanged();

    const updates = data.map(d => d.updateType);
    if (updates.includes(UpdateType.Whole) || (updates.includes(UpdateType.Y1) && updates.includes(UpdateType.Y2))) {
      return this.chartDataConverter.convert(newConfig);
    } else if (updates.includes(UpdateType.Y1)) {
      return this.chartDataConverter.convertAxisType(newConfig, ChartAxisType.Y1);
    } else if (updates.includes(UpdateType.Y2)) {
      return this.chartDataConverter.convertAxisType(newConfig, ChartAxisType.Y2);
    } else if (updates.includes(UpdateType.Type)) {
      return this.chartDataConverter.convertType(newConfig.type);
    } else {
      return this.chartDataConverter.convert(newConfig);
    }
  }

  private updateDataForConverter(latestData: Data) {
    this.chartDataConverter.updateData(
      latestData.collections,
      latestData.documents,
      latestData.permissions,
      latestData.query,
      latestData.config,
      latestData.linkTypes,
      latestData.linkInstances,
      latestData.constraintData
    );
  }

  public ngOnChanges(changes: SimpleChanges) {
    let updateType: UpdateType;
    if (this.onlyTypeChanged(changes)) {
      updateType = UpdateType.Type;
    } else if (this.shouldRefreshBothAxis(changes)) {
      updateType = UpdateType.Whole;
    } else if (this.shouldRefreshY1Axis(changes)) {
      updateType = UpdateType.Y1;
    } else if (this.shouldRefreshY2Axis(changes)) {
      updateType = UpdateType.Y2;
    } else if (this.onlySettingsChanged(changes)) {
      this.handleSettingsChanged();
      return;
    } else {
      updateType = UpdateType.Whole;
    }

    this.dataSubject.next({
      documents: this.documents,
      config: this.config,
      collections: this.collections,
      linkTypes: this.linkTypes,
      linkInstances: this.linkInstances,
      permissions: this.permissions,
      query: this.query,
      updateType,
      constraintData: this.constraintData,
    });
  }

  private onlySettingsChanged(changes: SimpleChanges): boolean {
    if (!changes.config || !changes.config.previousValue) {
      return false;
    }

    const previousConfig = changes.config.previousValue as ChartConfig;
    const currentConfig = changes.config.currentValue as ChartConfig;

    return chartSettingsChanged(previousConfig, currentConfig);
  }

  private handleSettingsChanged() {
    const settings: ChartSettings = {
      settings: {
        [ChartAxisType.X]: this.config.axes?.x?.settings,
        [ChartAxisType.Y1]: this.config.axes?.y1?.settings,
        [ChartAxisType.Y2]: this.config.axes?.y2?.settings,
      },
      rangeSlider: this.config.rangeSlider,
    };

    this.chartSettings$.next(deepObjectCopy(settings));
  }

  private onlyTypeChanged(changes: SimpleChanges): boolean {
    if (!changes.config) {
      return false;
    }

    const previousConfig = changes.config.previousValue;
    const currentConfig = changes.config.currentValue;

    if (!previousConfig || !currentConfig || previousConfig.type === currentConfig.type) {
      return false;
    }

    return deepObjectsEquals({...previousConfig, type: null}, {...currentConfig, type: null});
  }

  private shouldRefreshBothAxis(changes: SimpleChanges): boolean {
    if (
      changes.collections ||
      changes.documents ||
      changes.query ||
      changes.permissions ||
      (changes.config && changes.config.firstChange)
    ) {
      return true;
    }

    if (this.xAxisOrSortChanged(changes)) {
      return true;
    }

    return this.shouldRefreshY1Axis(changes) && this.shouldRefreshY2Axis(changes);
  }

  private xAxisOrSortChanged(changes: SimpleChanges): boolean {
    if (!changes.config || !changes.config.previousValue) {
      return false;
    }
    const previousConfig = changes.config.previousValue as ChartConfig;
    const currentConfig = changes.config.currentValue as ChartConfig;

    const sortPrevious = previousConfig.sort;
    const sortCurrent = currentConfig.sort;

    const xAxisPrevious = previousConfig.axes?.x?.axis;
    const xAxisCurrent = currentConfig.axes?.x?.axis;

    return !deepObjectsEquals(xAxisPrevious, xAxisCurrent) || !deepObjectsEquals(sortPrevious, sortCurrent);
  }

  private shouldRefreshY1Axis(changes: SimpleChanges): boolean {
    return this.shouldRefreshAxis(changes, ChartAxisType.Y1);
  }

  private shouldRefreshY2Axis(changes: SimpleChanges): boolean {
    return this.shouldRefreshAxis(changes, ChartAxisType.Y2);
  }

  private shouldRefreshAxis(changes: SimpleChanges, type: ChartAxisType) {
    if (!changes.config || !changes.config.previousValue) {
      return false;
    }

    const previousConfig = changes.config.previousValue as ChartConfig;
    const currentConfig = changes.config.currentValue as ChartConfig;

    return chartAxisChanged(previousConfig, currentConfig, type);
  }

  public onValueChange(valueChange: ValueChange) {
    if (valueChange.resourceType === AttributesResourceType.Collection) {
      this.onDocumentValueChange(valueChange);
    } else if (valueChange.resourceType === AttributesResourceType.LinkType) {
      this.onLinkValueChange(valueChange);
    }
  }

  private onDocumentValueChange(valueChange: ValueChange) {
    const attributeId = valueChange.setId;
    const documentId = valueChange.pointId;
    const value = valueChange.value;

    const changedDocument = (this.documents || []).find(document => document.id === documentId);
    if (!changedDocument) {
      return;
    }
    const collection = (this.collections || []).find(c => c.id === changedDocument.collectionId);
    const attribute = findAttribute(collection?.attributes, attributeId);
    const saveValue = this.convertSaveValue(value, attribute?.constraint);

    const patchDocument = {...changedDocument, data: {[attributeId]: saveValue}};
    this.patchData.emit(patchDocument);
  }

  private convertSaveValue(value: any, constraint: Constraint): any {
    if (!constraint) {
      return value;
    }

    return constraint.createDataValue(value, this.constraintData).serialize();
  }

  private onLinkValueChange(valueChange: ValueChange) {
    const attributeId = valueChange.setId;
    const linkInstanceId = valueChange.pointId;
    const value = valueChange.value;

    const changedLinkInstance = this.linkInstances.find(linkInstance => linkInstance.id === linkInstanceId);
    if (!changedLinkInstance) {
      return;
    }
    const linkType = (this.linkTypes || []).find(lt => lt.id === changedLinkInstance.linkTypeId);
    const attribute = findAttribute(linkType?.attributes, attributeId);
    const saveValue = this.convertSaveValue(value, attribute?.constraint);

    const patchLinkInstance = {...changedLinkInstance, data: {[attributeId]: saveValue}};
    this.patchLinkData.emit(patchLinkInstance);
  }

  public resize() {
    this.chartVisualizerComponent?.resize();
  }

  public onDetail(event: ClickEvent) {
    const {resource, dataResource} = this.findResourceAndDataResource(event);
    if (resource && dataResource) {
      this.modalService.showDataResourceDetail(dataResource, resource);
    }
  }

  private findResourceAndDataResource(event: ClickEvent): {resource: Resource; dataResource: DataResource} {
    if (event.resourceType === AttributesResourceType.Collection) {
      const document = (this.documents || []).find(doc => doc.id === event.pointId);
      const collection = document && (this.collections || []).find(coll => coll.id === document.collectionId);
      return {resource: collection, dataResource: document};
    }
    const linkInstance = (this.linkInstances || []).find(li => li.id === event.pointId);
    const linkType = linkInstance && (this.linkTypes || []).find(lt => lt.id === linkInstance.linkTypeId);
    return {resource: linkType, dataResource: linkInstance};
  }

  public onAxisSettingsChange(event: AxisSettingsChange) {
    const configCopy = deepObjectCopy(this.config);
    [ChartAxisType.X, ChartAxisType.Y1, ChartAxisType.Y2].forEach(axisType =>
      this.modifySettingsRange(axisType, event, configCopy)
    );

    if (!deepObjectsEquals(configCopy, this.config)) {
      this.configChange.emit(configCopy);
    }
  }

  private modifySettingsRange(type: ChartAxisType, event: AxisSettingsChange, config: ChartConfig) {
    if (!event.range || !Object.keys(event.range).includes(type)) {
      return;
    }

    if (event.range[type] === null) {
      delete config.axes?.[type]?.settings?.range;
    } else if (event.range[type]) {
      config.axes = config.axes || {};
      config.axes[type] = config.axes[type] || {};
      config.axes[type].settings = config.axes[type].settings || {};
      config.axes[type].settings.range = event.range[type];
    }
  }
}
