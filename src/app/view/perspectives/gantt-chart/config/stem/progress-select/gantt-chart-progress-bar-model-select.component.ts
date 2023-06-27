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

import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {DataAggregationType} from '../../../../../../shared/utils/data/data-aggregation';
import {GanttChartProgressBarModel, GanttChartStemConfig} from '../../../../../../core/store/gantt-charts/gantt-chart';
import {SelectItemModel} from '../../../../../../shared/select/select-item/select-item.model';

@Component({
  selector: 'gantt-chart-progress-bar-model-select',
  templateUrl: './gantt-chart-progress-bar-model-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartProgressBarModelSelectComponent {
  @Input()
  public config: GanttChartStemConfig;

  @Input()
  public property: string;

  @Input()
  public barInitialConfig: any;

  @Input()
  public selectItems: SelectItemModel[];

  @Output()
  public configChange = new EventEmitter<GanttChartStemConfig>();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';
  public readonly progressAggregations = [DataAggregationType.Avg, DataAggregationType.Sum];
  public readonly initialBarConfig: Partial<GanttChartProgressBarModel> = {aggregation: DataAggregationType.Avg};

  public onProgressAggregationSelect(aggregation: DataAggregationType) {
    const progress = {...this.config.progress, aggregation};
    const newConfig = {...this.config, progress};
    this.configChange.emit(newConfig);
  }
}
