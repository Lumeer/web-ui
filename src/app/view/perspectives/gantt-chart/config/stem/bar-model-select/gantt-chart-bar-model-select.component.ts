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

import {GanttChartBarModel, GanttChartStemConfig} from '../../../../../../core/store/gantt-charts/gantt-chart';
import {SelectItemModel} from '../../../../../../shared/select/select-item/select-item.model';

@Component({
  selector: 'gantt-chart-bar-model-select',
  templateUrl: './gantt-chart-bar-model-select.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartBarModelSelectComponent {
  @Input()
  public config: GanttChartStemConfig;

  @Input()
  public property: string;

  @Input()
  public initialBarConfig: any;

  @Input()
  public selectItems: SelectItemModel[];

  @Output()
  public configChange = new EventEmitter<GanttChartStemConfig>();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';

  public onBarPropertySelect(bar: GanttChartBarModel) {
    const newConfig = {...this.config, [this.property]: {...bar, ...this.initialBarConfig}};
    this.configChange.emit(newConfig);
  }

  public onBarPropertyRemoved() {
    const newConfig = {...this.config};
    delete newConfig[this.property];
    this.configChange.emit(newConfig);
  }
}
