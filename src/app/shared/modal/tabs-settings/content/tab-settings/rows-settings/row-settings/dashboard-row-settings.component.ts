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
import {DashboardRow} from '../../../../../../../core/model/dashboard-tab';

@Component({
  selector: 'dashboard-row-settings',
  templateUrl: './dashboard-row-settings.component.html',
  styleUrls: ['./dashboard-row-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardRowSettingsComponent implements OnChanges {

  @Input()
  public row: DashboardRow;

  @Output()
  public rowChange = new EventEmitter<DashboardRow>();

  @Output()
  public delete = new EventEmitter();

  public templateColumns: string;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.row) {
      this.templateColumns = this.row.cells.map(cell => `${cell.span}fr`).join(' ') + ' min-content min-content';
    }
  }

}
