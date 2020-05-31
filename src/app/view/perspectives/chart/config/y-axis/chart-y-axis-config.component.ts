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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {Constraint} from '../../../../../core/model/constraint';
import {AttributesResource} from '../../../../../core/model/resource';
import {ChartAxis, ChartConfig, ChartType} from '../../../../../core/store/charts/chart';
import {DataAggregationType} from '../../../../../shared/utils/data/data-aggregation';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {SelectItemWithConstraintId} from '../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {getAttributesResourceType} from '../../../../../shared/utils/resource.utils';
import {ChartYAxisType} from '../../data/convertor/chart-data';
import {deepObjectCopy} from '../../../../../shared/utils/common.utils';

@Component({
  selector: 'chart-y-axis-config',
  templateUrl: './chart-y-axis-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartYAxisConfigComponent {
  @Input()
  public yAxisType: ChartYAxisType;

  @Input()
  public attributesResources: AttributesResource[];

  @Input()
  public config: ChartConfig;

  @Output()
  public configChange = new EventEmitter<ChartConfig>();

  public readonly chartAggregations = Object.values(DataAggregationType);
  public readonly chartType = ChartType;
  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly axisEmptyValue: string;

  constructor(private i18n: I18n) {
    this.axisEmptyValue = i18n({id: 'perspective.chart.config.axis.empty', value: 'Select axis'});
  }

  public onAxisSelect(itemId: SelectItemWithConstraintId) {
    this.onSelect(itemId, 'axis');
  }

  public onDataNameSelect(itemId: SelectItemWithConstraintId) {
    this.onSelect(itemId, 'name');
  }

  private onSelect(itemId: SelectItemWithConstraintId, param: string) {
    const resource = this.attributesResources[itemId.resourceIndex];
    if (!resource) {
      return;
    }

    const resourceType = getAttributesResourceType(resource);
    const axis: ChartAxis = {...itemId, resourceId: resource.id, resourceType};
    this.emitNewAxis(axis, param);
  }

  private emitNewAxis(chartAxis: ChartAxis, param: string) {
    const configCopy = this.copyConfigSafely();
    configCopy.axes[this.yAxisType][param] = chartAxis;

    this.configChange.emit(configCopy);
  }

  private copyConfigSafely(): ChartConfig {
    const configCopy = deepObjectCopy(this.config);
    configCopy.axes = configCopy.axes || {};
    configCopy.axes[this.yAxisType] = configCopy.axes[this.yAxisType] || {};
    return configCopy;
  }

  public onAxisRemoved() {
    this.onRemoved('axis');
  }

  public onDataNameRemoved() {
    this.onRemoved('name');
  }

  private onRemoved(param: string) {
    const configCopy = deepObjectCopy(this.config);
    delete configCopy.axes?.[this.yAxisType]?.[param];

    this.configChange.emit(configCopy);
  }

  public onAxisConstraintSelect(constraint: Constraint) {
    this.onConstraintSelect(constraint, 'axis');
  }

  public onDataNameConstraintSelect(constraint: Constraint) {
    this.onConstraintSelect(constraint, 'name');
  }

  public onConstraintSelect(constraint: Constraint, param: string) {
    const axis = this.config.axes?.[this.yAxisType]?.[param];
    if (axis) {
      const newAxis = {...axis, constraint};
      this.emitNewAxis(newAxis, param);
    }
  }

  public onAggregationSelect(aggregation: DataAggregationType) {
    const configCopy = this.copyConfigSafely();
    configCopy.axes[this.yAxisType].aggregation = aggregation;
    this.configChange.emit(configCopy);
  }

  public onColorSelect(id: SelectItemWithConstraintId) {
    this.onSelect(id, 'color');
  }

  public onColorRemoved() {
    this.onRemoved('color');
  }

  public onSizeSelect(id: SelectItemWithConstraintId) {
    this.onSelect(id, 'size');
  }

  public onSizeRemoved() {
    this.onRemoved('size');
  }
}
