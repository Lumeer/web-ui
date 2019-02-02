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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {Query} from '../../../../core/store/navigation/query';
import {ChartAxisType, ChartConfig} from '../../../../core/store/charts/chart';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {ChartData} from './convertor/chart-data';
import {BehaviorSubject} from 'rxjs';
import {deepObjectsEquals} from '../../../../shared/utils/common.utils';
import {ChartDataConverter} from './convertor/chart-data-converter';

@Component({
  selector: 'chart-data',
  templateUrl: './chart-data.component.html',
  providers: [ChartDataConverter],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartDataComponent implements OnChanges {
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
  public config: ChartConfig;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  public chartData$ = new BehaviorSubject<ChartData>(null);

  constructor(private chartDataConverter: ChartDataConverter) {}

  public ngOnChanges(changes: SimpleChanges) {
    this.chartDataConverter.updateData(
      this.collections,
      this.documents,
      this.permissions,
      this.query,
      this.linkTypes,
      this.linkInstances
    );
    let chartData: ChartData;
    if (this.onlyTypeChanged(changes)) {
      console.log('onlyType');
      chartData = this.chartDataConverter.convertType(this.config.type);
    } else if (this.shouldRefreshBothAxis(changes)) {
      console.log('both 1');
      chartData = this.chartDataConverter.convert(this.config);
    } else if (this.shouldRefreshY1Axis(changes)) {
      console.log('just y1');
      chartData = this.chartDataConverter.convertAxisType(this.config, ChartAxisType.Y1);
    } else if (this.shouldRefreshY2Axis(changes)) {
      console.log('just y2');
      chartData = this.chartDataConverter.convertAxisType(this.config, ChartAxisType.Y2);
    } else {
      console.log('both 2');
      chartData = this.chartDataConverter.convert(this.config);
    }
    this.chartData$.next(chartData);
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

    if (this.xAxisChanged(changes) || this.sortChanged(changes)) {
      return true;
    }

    return this.shouldRefreshY1Axis(changes) && this.shouldRefreshY2Axis(changes);
  }

  private xAxisChanged(changes: SimpleChanges): boolean {
    if (!changes.config || !changes.config.previousValue) {
      return false;
    }
    const previousConfig = changes.config.previousValue as ChartConfig;
    const currentConfig = changes.config.currentValue as ChartConfig;

    const xAxisPrevious = previousConfig.axes && previousConfig.axes[ChartAxisType.X];
    const xAxisCurrent = currentConfig.axes && currentConfig.axes[ChartAxisType.X];

    return !deepObjectsEquals(xAxisPrevious, xAxisCurrent);
  }

  private sortChanged(changes: SimpleChanges): boolean {
    if (!changes.config || !changes.config.previousValue) {
      return false;
    }
    const previousConfig = changes.config.previousValue as ChartConfig;
    const currentConfig = changes.config.currentValue as ChartConfig;

    const sortPrevious = previousConfig.sort;
    const sortCurrent = currentConfig.sort;

    return !deepObjectsEquals(sortPrevious, sortCurrent);
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
}
