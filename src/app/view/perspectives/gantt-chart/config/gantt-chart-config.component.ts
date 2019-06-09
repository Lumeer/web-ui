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
import {GanttChartCollectionConfig, GanttChartConfig} from '../../../../core/store/gantt-charts/gantt-chart';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {Query, QueryStem} from '../../../../core/store/navigation/query';

@Component({
  selector: 'gantt-chart-config',
  templateUrl: './gantt-chart-config.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartConfigComponent {
  @Input()
  public collections: Collection[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public query: Query;

  @Input()
  public config: GanttChartConfig;

  @Output()
  public configChange = new EventEmitter<GanttChartConfig>();

  public readonly viewModePlaceholder: string;

  constructor(private i18n: I18n) {
    this.viewModePlaceholder = i18n({id: 'ganttChart.mode.placeholder', value: 'View mode'});
  }

  public onConfigChange(stem: QueryStem, collectionConfig: GanttChartCollectionConfig) {
    const collectionsConfig = {...(this.config.collections || {})};
    collectionsConfig[stem.collectionId] = collectionConfig;
    this.configChange.emit({...this.config, collections: collectionsConfig});
  }

  public trackByCollection(index: number, stem: QueryStem): string {
    return stem.collectionId;
  }
}
