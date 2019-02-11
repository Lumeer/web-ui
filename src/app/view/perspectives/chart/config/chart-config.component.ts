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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {
  ChartAggregation,
  ChartAxis,
  ChartAxisType,
  ChartConfig,
  ChartSortType,
  ChartType,
} from '../../../../core/store/charts/chart';
import {Perspective} from '../../perspective';
import {Query} from '../../../../core/store/navigation/query';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'chart-config',
  templateUrl: './chart-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartConfigComponent {
  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public config: ChartConfig;

  @Input()
  public query: Query;

  @Output()
  public configChange = new EventEmitter<ChartConfig>();

  public readonly chartTypes = Object.values(ChartType);
  public readonly chartPerspective = Perspective.Chart;
  public readonly chartAggregations = Object.values(ChartAggregation);
  public readonly chartSortTypes = Object.values(ChartSortType);

  public readonly xAxisType = ChartAxisType.X;
  public readonly yAxisTypes = [ChartAxisType.Y1, ChartAxisType.Y2];

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

  public onAggregationSelect(type: ChartAxisType, aggregation: ChartAggregation) {
    const aggregations = {...(this.config.aggregations || {}), [type]: aggregation};
    const newConfig = {...this.config, aggregations};
    this.configChange.emit(newConfig);
  }

  public onAxisSelect(type: ChartAxisType, axis: ChartAxis) {
    const axes = {...this.config.axes, [type]: axis};
    const newConfig = {...this.config, axes};
    this.configChange.emit(newConfig);
  }

  public onDataNameSelect(type: ChartAxisType, axis: ChartAxis) {
    const names = {...(this.config.names || {}), [type]: axis};
    const newConfig = {...this.config, names};
    this.configChange.emit(newConfig);
  }

  public onAxisRemoved(type: ChartAxisType) {
    const axes = {...this.config.axes};
    delete axes[type];
    const newConfig = {...this.config, axes};
    this.configChange.emit(newConfig);
  }

  public onDataNameRemoved(type: ChartAxisType) {
    const names = {...(this.config.names || {})};
    delete names[type];
    const newConfig = {...this.config, names};
    this.configChange.emit(newConfig);
  }
}
