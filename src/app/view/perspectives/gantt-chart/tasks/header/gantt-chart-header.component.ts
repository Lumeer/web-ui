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

import {GanttChartMode} from '../../../../../core/store/gantt-charts/gantt-chart';
import {objectValues} from '../../../../../shared/utils/common.utils';

@Component({
  selector: 'gantt-chart-header',
  templateUrl: './gantt-chart-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartHeaderComponent {
  @Input()
  public currentMode: GanttChartMode;

  @Input()
  public canManageConfig: boolean;

  @Input()
  public sortChanged: boolean;

  @Output()
  public modeChange = new EventEmitter<GanttChartMode>();

  @Output()
  public scrollToToday = new EventEmitter();

  @Output()
  public resetSort = new EventEmitter();

  public readonly ganttChartModes = objectValues(GanttChartMode);

  public onModeSelect(mode: GanttChartMode) {
    this.currentMode = mode;
    this.modeChange.next(mode);
  }

  public onScrollToTodayClick() {
    this.scrollToToday.emit();
  }
}
