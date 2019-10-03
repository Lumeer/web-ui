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
import {Collection} from '../../../../core/store/collections/collection';
import {ChartAxisType, ChartConfig} from '../../../../core/store/charts/chart';
import {Query} from '../../../../core/store/navigation/query/query';
import {LinkType} from '../../../../core/store/link-types/link.type';

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

  public readonly yAxisTypes = [ChartAxisType.Y1, ChartAxisType.Y2];

  public onConfigChange(config: ChartConfig) {
    this.configChange.emit(config);
  }
}
