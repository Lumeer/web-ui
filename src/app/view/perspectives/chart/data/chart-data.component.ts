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
import {DateTimeConstraintConfig} from '../../../../core/model/data/constraint-config';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {Query} from '../../../../core/store/navigation/query';
import {ChartAxisType, ChartConfig} from '../../../../core/store/charts/chart';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {ChartData, convertChartDateFormat} from './convertor/chart-data';
import {BehaviorSubject, Observable} from 'rxjs';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {ChartDataConverter} from './convertor/chart-data-converter';
import {ValueChange} from '../visualizer/plot-maker/plot-maker';
import {ChartVisualizerComponent} from './visualizer/chart-visualizer.component';
import {buffer, debounceTime, filter, map} from 'rxjs/operators';
import {getSaveValue} from '../../../../shared/utils/data.utils';
import {Constraint, ConstraintData, ConstraintType} from '../../../../core/model/data/constraint';
import * as moment from 'moment';
import {AttributesResourceType} from '../../../../core/model/resource';
import {checkOrTransformChartConfig} from '../visualizer/chart-util';

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

  constructor(private chartDataConverter: ChartDataConverter) {}

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

    const xAxisPrevious = previousConfig.axes && previousConfig.axes[ChartAxisType.X];
    const xAxisCurrent = currentConfig.axes && currentConfig.axes[ChartAxisType.X];

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

    const yAxisPrevious = previousConfig.axes && previousConfig.axes[type];
    const yAxisCurrent = currentConfig.axes && currentConfig.axes[type];

    const yDataSetPrevious = previousConfig.names && previousConfig.names[type];
    const yDataSetCurrent = currentConfig.names && currentConfig.names[type];

    const yAggregationPrevious = previousConfig.aggregations && previousConfig.aggregations[type];
    const yAggregationCurrent = currentConfig.aggregations && currentConfig.aggregations[type];

    return (
      !deepObjectsEquals(yAxisPrevious, yAxisCurrent) ||
      !deepObjectsEquals(yDataSetPrevious, yDataSetCurrent) ||
      !deepObjectsEquals(yAggregationPrevious, yAggregationCurrent)
    );
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
    const attribute = ((collection && collection.attributes) || []).find(a => a.id === attributeId);
    const saveValue = this.convertSaveValue(value, attribute && attribute.constraint);

    const patchDocument = {...changedDocument, data: {[attributeId]: saveValue}};
    this.patchData.emit(patchDocument);
  }

  private convertSaveValue(value: any, constraint: Constraint): any {
    if (!value || !constraint) {
      return getSaveValue(value, constraint);
    }

    if (constraint.type === ConstraintType.DateTime) {
      const config = constraint.config && (constraint.config as DateTimeConstraintConfig);
      return moment(value, convertChartDateFormat(config && config.format)).toISOString();
    }

    return getSaveValue(value, constraint);
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
    const attribute = ((linkType && linkType.attributes) || []).find(a => a.id === attributeId);
    const saveValue = this.convertSaveValue(value, attribute && attribute.constraint);

    const patchLinkInstance = {...changedLinkInstance, data: {[attributeId]: saveValue}};
    this.patchLinkData.emit(patchLinkInstance);
  }

  public resize() {
    this.chartVisualizerComponent && this.chartVisualizerComponent.resize();
  }
}
