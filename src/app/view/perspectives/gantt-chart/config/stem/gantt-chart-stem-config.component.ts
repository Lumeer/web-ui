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

import {Collection} from '../../../../../core/store/collections/collection';
import {GanttChartStemConfig} from '../../../../../core/store/gantt-charts/gantt-chart';
import {LinkType} from '../../../../../core/store/link-types/link.type';
import {QueryStem} from '../../../../../core/store/navigation/query/query';
import {SelectItemModel} from '../../../../../shared/select/select-item/select-item.model';

@Component({
  selector: 'gantt-chart-stem-config',
  templateUrl: './gantt-chart-stem-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartStemConfigComponent {
  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public stem: QueryStem;

  @Input()
  public selectItems: SelectItemModel[];

  @Input()
  public config: GanttChartStemConfig;

  @Output()
  public configChange = new EventEmitter<GanttChartStemConfig>();

  @Output()
  public categoryRemove = new EventEmitter<number>();

  @Output()
  public attributeRemove = new EventEmitter<number>();

  public onBarCategoryRemoved(index: number) {
    this.categoryRemove.emit(index);
  }

  public onBarAttributeRemoved(index: number) {
    this.attributeRemove.emit(index);
  }
}
