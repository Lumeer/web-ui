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

import {Component, ChangeDetectionStrategy, Input, Output, EventEmitter} from '@angular/core';
import {Collection} from '../../../../../core/store/collections/collection';
import {
  GanttChartBarModel,
  GanttChartBarProperty,
  GanttChartBarPropertyOptional,
  GanttChartBarPropertyRequired,
  GanttChartCollectionConfig,
} from '../../../../../core/store/gantt-charts/gantt-chart';

@Component({
  selector: 'gantt-chart-collection-config',
  templateUrl: './gantt-chart-collection-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartCollectionConfigComponent {
  @Input()
  public collection: Collection;

  @Input()
  public config: GanttChartCollectionConfig;

  @Output()
  public configChange = new EventEmitter<GanttChartCollectionConfig>();

  public readonly ganttChartBarsPropertiesRequired = Object.values(GanttChartBarPropertyRequired);
  public readonly ganttChartBarsPropertiesOptional = Object.values(GanttChartBarPropertyOptional);
  public readonly buttonClasses = 'flex-grow-1 text-truncate';

  public onBarPropertySelect(type: GanttChartBarProperty, bar: GanttChartBarModel) {
    const bars = {...(this.config.barsProperties || {}), [type]: bar};
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyRemoved(type: GanttChartBarProperty) {
    const bars = {...(this.config.barsProperties || {})};
    delete bars[type];
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }
}
