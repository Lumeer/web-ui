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
import {ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output, SimpleChanges} from '@angular/core';

import {deepObjectCopy} from '@lumeer/utils';

import {
  GanttChartBarModel,
  GanttChartColorBarModel,
  GanttChartStemConfig,
} from '../../../../../../core/store/gantt-charts/gantt-chart';
import {selectDefaultPalette} from '../../../../../../shared/picker/colors';
import {SelectItemModel} from '../../../../../../shared/select/select-item/select-item.model';

@Component({
  selector: 'gantt-chart-milestones-select',
  templateUrl: './gantt-chart-milestones-select.component.html',
  styleUrls: ['./gantt-chart-milestones-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartMilestonesSelectComponent implements OnChanges {
  @Input()
  public config: GanttChartStemConfig;

  @Input()
  public selectItems: SelectItemModel[];

  @Output()
  public configChange = new EventEmitter<GanttChartStemConfig>();

  public readonly buttonClasses = 'flex-grow-1 text-truncate';

  public models: GanttChartColorBarModel[] = [];

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.config || changes.property) {
      this.models = [...(this.config?.milestones || []), null];
    }
  }

  public onSelect(bar: GanttChartBarModel, index: number) {
    this.setItemAtIndex(bar, index);
  }

  public onColorSelect(color: string, index: number) {
    const bar = this.config.milestones?.[index];
    this.setItemAtIndex({...bar, color}, index);
  }

  public onColorRemove(index: number) {
    const bar = this.config.milestones?.[index];
    this.setItemAtIndex({...bar, color: undefined}, index);
  }

  private setItemAtIndex(bar: GanttChartColorBarModel, index: number) {
    const newConfig = deepObjectCopy(this.config);
    if (!newConfig.milestones) {
      newConfig.milestones = [];
    }
    const initialColor = selectDefaultPalette[index % selectDefaultPalette.length];
    newConfig.milestones[index] = {...bar, color: bar.color || initialColor};
    this.configChange.emit(newConfig);
  }

  public onRemove(index: number) {
    const newConfig = deepObjectCopy(this.config);
    newConfig.milestones.splice(index, 1);
    this.configChange.emit(newConfig);
  }
}
