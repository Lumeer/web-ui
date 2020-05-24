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
import {ChartAxis, ChartAxisType, ChartConfig} from '../../../../../core/store/charts/chart';
import {ChartYAxisType} from '../../data/convertor-old/chart-data-old';
import {DataAggregationType} from '../../../../../shared/utils/data/data-aggregation';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {SelectItemWithConstraintId} from '../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {getAttributesResourceType} from '../../../../../shared/utils/resource.utils';

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
  public readonly buttonClasses = 'flex-grow-1  text-truncate';
  public readonly axisEmptyValue: string;

  constructor(private i18n: I18n) {
    this.axisEmptyValue = i18n({id: 'perspective.chart.config.axis.empty', value: 'Select axis'});
  }

  public onAxisSelect(itemId: SelectItemWithConstraintId) {
    this.onSelect(itemId, 'axes');
  }

  public onDataNameSelect(itemId: SelectItemWithConstraintId) {
    this.onSelect(itemId, 'names');
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

  private emitNewAxis(axis: ChartAxis, param: string) {
    const axes = {...this.config[param]};
    const newConfig = {...this.config};
    axes[this.yAxisType] = axis;
    newConfig[param] = axes;
    this.configChange.emit(newConfig);
  }

  public onAxisRemoved() {
    this.onRemoved('axes');
  }

  public onDataNameRemoved() {
    this.onRemoved('names');
  }

  private onRemoved(param: string) {
    const axes = {...this.config[param]};
    delete axes[this.yAxisType];
    const newConfig = {...this.config};
    newConfig[param] = axes;
    this.configChange.emit(newConfig);
  }

  public onAxisConstraintSelect(constraint: Constraint) {
    this.onConstraintSelect(constraint, 'axes');
  }

  public onDataNameConstraintSelect(constraint: Constraint) {
    this.onConstraintSelect(constraint, 'names');
  }

  public onConstraintSelect(constraint: Constraint, param: string) {
    const axis = this.config[param] && this.config[param][this.yAxisType];
    if (axis) {
      const newAxis = {...axis, constraint};
      this.emitNewAxis(newAxis, param);
    }
  }

  public onAggregationSelect(type: ChartAxisType, aggregation: DataAggregationType) {
    const aggregations = {...(this.config.aggregations || {}), [type]: aggregation};
    const newConfig = {...this.config, aggregations};
    this.configChange.emit(newConfig);
  }
}
