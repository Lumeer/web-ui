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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output} from '@angular/core';
import {Constraint} from '../../../../../core/model/constraint';
import {AttributesResource} from '../../../../../core/model/resource';
import {ChartAxis, ChartAxisType, ChartConfig, ChartSortType, ChartType} from '../../../../../core/store/charts/chart';
import {Perspective} from '../../../perspective';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {SelectItemWithConstraintId} from '../../../../../shared/select/select-constraint-item/select-item-with-constraint.component';
import {getAttributesResourceType} from '../../../../../shared/utils/resource.utils';

@Component({
  selector: 'chart-main-config',
  templateUrl: './chart-main-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartMainConfigComponent {
  @Input()
  public attributesResources: AttributesResource[];

  @Input()
  public config: ChartConfig;

  @Output()
  public configChange = new EventEmitter<ChartConfig>();

  public readonly chartTypes = Object.values(ChartType);
  public readonly chartPerspective = Perspective.Chart;
  public readonly chartSortTypes = Object.values(ChartSortType);

  public readonly xAxisType = ChartAxisType.X;

  public readonly buttonClasses = 'flex-grow-1  text-truncate';

  public readonly sortPlaceholder: string;
  public readonly sortTypePlaceholder: string;
  public readonly axisEmptyValue: string;

  constructor(private i18n: I18n) {
    this.sortPlaceholder = i18n({id: 'perspective.chart.config.sort.placeholder', value: 'Sort'});
    this.sortTypePlaceholder = i18n({id: 'perspective.chart.config.sortType.placeholder', value: 'Sort order'});
    this.axisEmptyValue = i18n({id: 'perspective.chart.config.axis.empty', value: 'Select axis'});
  }

  public onTypeSelect(type: ChartType) {
    const newConfig = {...this.config, type};
    this.configChange.emit(newConfig);
  }

  public onSortSelect(axis: ChartAxis) {
    const sort = {...(this.config.sort || {type: ChartSortType.Ascending}), axis};
    const newConfig = {...this.config, sort};
    this.configChange.emit(newConfig);
  }

  public onSortTypeSelect(type: ChartSortType) {
    const sort = {...(this.config.sort || {type}), type};
    const newConfig = {...this.config, sort};
    this.configChange.emit(newConfig);
  }

  public onSortRemoved() {
    this.onSortSelect(null);
  }

  public onAxisSelect(itemId: SelectItemWithConstraintId) {
    const resource = this.attributesResources[itemId.resourceIndex];
    if (!resource) {
      return;
    }

    const resourceType = getAttributesResourceType(resource);
    const axis: ChartAxis = {...itemId, resourceId: resource.id, resourceType};
    this.emitNewAxis(axis);
  }

  private emitNewAxis(axis: ChartAxis) {
    const axes = {...this.config.axes, [this.xAxisType]: axis};
    const newConfig = {...this.config, axes};
    this.configChange.emit(newConfig);
  }

  public onAxisRemoved() {
    const axes = {...this.config.axes};
    delete axes[this.xAxisType];
    const newConfig = {...this.config, axes};
    this.configChange.emit(newConfig);
  }

  public onSelectedConstraint(constraint: Constraint) {
    const axis = this.config.axes && this.config.axes[this.xAxisType];
    if (axis) {
      const newAxis = {...axis, constraint};
      this.emitNewAxis(newAxis);
    }
  }
}
