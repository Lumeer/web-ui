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

import {Component, ChangeDetectionStrategy, Input, EventEmitter, Output, ViewChild} from '@angular/core';
import {DashboardLayoutType, DashboardRow} from '../../../../../../core/model/dashboard-tab';
import {DropdownComponent} from '../../../../../dropdown/dropdown.component';
import {DashboardRowLayoutComponent} from './row-layout/dashboard-row-layout.component';

@Component({
  selector: 'dashboard-rows-settings',
  templateUrl: './dashboard-rows-settings.component.html',
  styleUrls: ['./dashboard-rows-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardRowsSettingsComponent {

  @Input()
  public rows: DashboardRow[]

  @Output()
  public rowsChange = new EventEmitter<DashboardRow[]>();

  @ViewChild(DashboardRowLayoutComponent)
  public layoutComponent: DashboardRowLayoutComponent;

  public onRowChange(row: DashboardRow, index: number) {
    const newRows = [...(this.rows || [])];
    newRows[index] = row;
    this.rowsChange.next(newRows);
  }

  public addNewRow(layout: DashboardLayoutType) {
    const newRows = [...(this.rows || [])];
    const cells = layout.map(span => ({span}));
    newRows.push({cells});
    this.rowsChange.next(newRows);
  }

  public onNewRow() {
    this.layoutComponent.toggle();
  }

  public onRowDelete(index: number) {
    const newRows = [...(this.rows || [])];
    newRows.splice(index, 1);
    this.rowsChange.next(newRows);
  }
}
