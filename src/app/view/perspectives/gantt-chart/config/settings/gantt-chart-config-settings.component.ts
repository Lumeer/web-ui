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
import {GanttChartConfig} from '../../../../../core/store/gantt-charts/gantt-chart';
import {generateId} from '../../../../../shared/utils/resource.utils';
import {deepObjectCopy} from '../../../../../shared/utils/common.utils';

@Component({
  selector: 'gantt-chart-config-settings',
  templateUrl: './gantt-chart-config-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartConfigSettingsComponent {
  @Input()
  public config: GanttChartConfig;

  @Output()
  public configChange = new EventEmitter<GanttChartConfig>();

  public readonly savePositionId = generateId();
  public readonly lockResizeId = generateId();

  public onSavePositionChange(checked: boolean) {
    this.onBooleanPropertyChange('positionSaved', checked);
  }

  public onLockResizeChange(checked: boolean) {
    this.onBooleanPropertyChange('lockResize', checked);
  }

  private onBooleanPropertyChange(property: string, checked: boolean) {
    const config = deepObjectCopy<GanttChartConfig>(this.config);
    if (checked) {
      config[property] = true;
    } else {
      delete config[property];
    }

    this.configChange.emit(config);
  }
}
