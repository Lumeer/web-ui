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

import {ConstraintData} from '@lumeer/data-filters';

import {DataInputConfiguration} from '../../../../../shared/data-input/data-input-configuration';
import {PivotData} from '../../util/pivot-data';
import {PivotTable, PivotTableCell} from '../../util/pivot-table';
import {PivotTableConverter} from '../../util/pivot-table-converter';

@Component({
  selector: 'pivot-table',
  templateUrl: './pivot-table.component.html',
  styleUrls: ['./pivot-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PivotTableComponent implements OnChanges {
  @Input()
  public pivotData: PivotData;

  @Input()
  public constraintData: ConstraintData;

  @Input()
  public dataLoaded: boolean;

  @Output()
  public cellClick = new EventEmitter<PivotTableCell>();

  public readonly configuration: DataInputConfiguration = {common: {inline: true, minWidth: 40}};

  private pivotTableConverter: PivotTableConverter;

  public pivotTables: PivotTable[];

  constructor() {
    const headerSummaryString = $localize`:@@perspective.pivot.table.summary.header:Summary of`;
    const summaryString = $localize`:@@perspective.pivot.table.summary.total:Summary`;
    this.pivotTableConverter = new PivotTableConverter(headerSummaryString, summaryString);
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.pivotData) {
      this.pivotTables = this.pivotTableConverter.transform(this.pivotData);
    }
  }

  public onCellClick(cell: PivotTableCell) {
    this.cellClick.next(cell);
  }
}
