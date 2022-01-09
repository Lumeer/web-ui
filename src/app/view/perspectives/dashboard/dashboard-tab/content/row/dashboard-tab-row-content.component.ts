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
import {DashboardCell, DashboardRow} from '../../../../../../core/model/dashboard-tab';
import {View} from '../../../../../../core/store/views/view';
import {filterValidDashboardCells} from '../../../../../../shared/utils/dashboard.utils';
import {Query} from '../../../../../../core/store/navigation/query/query';

@Component({
  selector: 'dashboard-tab-row-content',
  templateUrl: './dashboard-tab-row-content.component.html',
  styleUrls: ['./dashboard-tab-row-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTabRowContentComponent implements OnChanges {
  @Input()
  public dashboardRow: DashboardRow;

  @Input()
  public views: View[];

  @Input()
  public query: Query;

  public templateColumns: string;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.dashboardRow) {
      this.computeTemplateColumns();
    }
  }

  private computeTemplateColumns() {
    const validCells = filterValidDashboardCells(this.dashboardRow?.cells);
    this.templateColumns = validCells.map(cell => `${cell.span}fr`).join(' ');
  }

  public trackByCell(index: number, cell: DashboardCell): string {
    return cell.id || String(index);
  }
}
