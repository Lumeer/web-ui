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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, OnChanges, SimpleChanges} from '@angular/core';
import {DashboardLayoutType, DashboardRow} from '../../../../../../../core/model/dashboard-tab';
import {filterValidDashboardCells} from '../../../../../../utils/dashboard.utils';
import {View} from '../../../../../../../core/store/views/view';

@Component({
  selector: 'dashboard-row-settings',
  templateUrl: './dashboard-row-settings.component.html',
  styleUrls: ['./dashboard-row-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardRowSettingsComponent implements OnChanges {
  @Input()
  public row: DashboardRow;

  @Input()
  public views: View[];

  @Output()
  public rowChange = new EventEmitter<DashboardRow>();

  @Input()
  public selectedColumn: number;

  @Output()
  public delete = new EventEmitter();

  @Output()
  public cellSelect = new EventEmitter<number>();

  public templateColumns: string;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.row) {
      this.templateColumns =
        filterValidDashboardCells(this.row?.cells)
          .map(cell => `${cell.span}fr`)
          .join(' ') + ' min-content min-content';
    }
  }

  public onLayoutSelected(layoutType: DashboardLayoutType) {
    const cells = [...(this.row.cells || [])];
    for (let i = 0; i < layoutType.length; i++) {
      if (cells[i]) {
        cells[i] = {...cells[i], span: layoutType[i]};
      } else {
        cells.push({span: layoutType[i]});
      }
    }

    if (cells.length > layoutType.length) {
      for (let i = layoutType.length; i < cells.length; i++) {
        cells[i] = {...cells[i], span: null};
      }
    }

    const newRow = {...this.row, cells};
    this.rowChange.next(newRow);
  }
}
