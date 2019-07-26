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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {PivotData} from '../../util/pivot-data';
import {BehaviorSubject} from 'rxjs';
import {PivotTable} from '../../util/pivot-table';
import {PivotTableConverter} from '../../util/pivot-table-converter';
import {I18n} from '@ngx-translate/i18n-polyfill';

@Component({
  selector: 'pivot-table',
  templateUrl: './pivot-table.component.html',
  styleUrls: ['./pivot-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotTableComponent implements OnChanges {
  @Input()
  public pivotData: PivotData;

  private pivotTableConverter: PivotTableConverter;

  public pivotTables$ = new BehaviorSubject<PivotTable[]>([]);

  constructor(private i18n: I18n) {
    const headerSummaryString = i18n({id: 'perspective.pivot.table.summary.header', value: 'Summary of'});
    const summaryString = i18n({id: 'perspective.pivot.table.summary.total', value: 'Sum total'});
    this.pivotTableConverter = new PivotTableConverter(headerSummaryString, summaryString);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.pivotData) {
      this.pivotTables$.next(this.pivotTableConverter.transform(this.pivotData));
    }
  }
}
