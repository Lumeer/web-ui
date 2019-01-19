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

import {Component, ChangeDetectionStrategy, OnChanges, Input, SimpleChanges, Output, EventEmitter} from '@angular/core';
import {Collection} from '../../../../core/store/collections/collection';
import {DocumentModel} from '../../../../core/store/documents/document.model';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {LinkInstance} from '../../../../core/store/link-instances/link.instance';
import {Query} from '../../../../core/store/navigation/query';
import {ChartConfig} from '../../../../core/store/charts/chart';
import {AllowedPermissions} from '../../../../core/model/allowed-permissions';
import {ChartData} from './convertor/chart-data';
import {BehaviorSubject} from 'rxjs';
import {convertChartData} from './convertor/data-convertor';

@Component({
  selector: 'chart-data',
  templateUrl: './chart-data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartDataComponent implements OnChanges {
  @Input()
  public collections: Collection[];

  @Input()
  public documents: DocumentModel[];

  @Input()
  public linkTypes: LinkType[];

  @Input()
  public linkInstances: LinkInstance[];

  @Input()
  public allowedPermissions: AllowedPermissions;

  @Input()
  public query: Query;

  @Input()
  public config: ChartConfig;

  @Output()
  public patchData = new EventEmitter<DocumentModel>();

  public chartData$ = new BehaviorSubject<ChartData>(null);

  public ngOnChanges(changes: SimpleChanges) {
    const chartData = convertChartData(
      this.config,
      this.documents,
      this.collections,
      this.query,
      this.linkTypes,
      this.linkInstances
    );
    this.chartData$.next(chartData);
  }
}
