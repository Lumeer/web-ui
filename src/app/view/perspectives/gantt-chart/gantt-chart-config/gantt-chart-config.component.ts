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
import {Collection} from '../../../../core/store/collections/collection';
import {
  GanttChartBarModel,
  GanttChartBarPropertyOptional,
  GanttChartBarPropertyRequired,
  GanttChartConfig,
  GanttChartMode,
} from '../../../../core/store/gantt-charts/gantt-chart';

@Component({
  selector: 'gantt-chart-config',
  templateUrl: './gantt-chart-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartConfigComponent {
  @Input()
  public collection: Collection;

  @Input()
  public config: GanttChartConfig;

  @Output()
  public configChange = new EventEmitter<GanttChartConfig>();

  public readonly ganntChartViewMode = 'view mode';
  public readonly ganttChartModes = Object.values(GanttChartMode);
  public readonly ganttChartBarsPropertiesRequired = Object.values(GanttChartBarPropertyRequired);
  public readonly ganttChartBarsPropertiesOptional = Object.values(GanttChartBarPropertyOptional);

  public propertiesNotSetYet: boolean = true;

  public allRequiredPropertiesSet() {
    //this.propertiesNotSetYet = false;
    return (
      this.config.mode &&
      this.config.barsProperties[GanttChartBarPropertyRequired.NAME] &&
      this.config.barsProperties[GanttChartBarPropertyRequired.START] &&
      this.config.barsProperties[GanttChartBarPropertyRequired.END] &&
      !(this.propertiesNotSetYet = false)
    );
  }

  public onModeSelect(mode: GanttChartMode) {
    const newConfig = {...this.config, mode: mode};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyRequiredSelect(type: GanttChartBarPropertyRequired, bar: GanttChartBarModel) {
    const bars = {...this.config.barsProperties, [type]: bar};
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyRequiredRemoved(type: GanttChartBarPropertyRequired) {
    const bars = {...this.config.barsProperties};
    delete bars[type];
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyOptionalSelect(type: GanttChartBarPropertyOptional, bar: GanttChartBarModel) {
    const bars = {...this.config.barsProperties, [type]: bar};
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyOptionalRemoved(type: GanttChartBarPropertyOptional) {
    const bars = {...this.config.barsProperties};
    delete bars[type];
    const newConfig = {...this.config, barsProperties: bars};
    this.configChange.emit(newConfig);
  }
}
