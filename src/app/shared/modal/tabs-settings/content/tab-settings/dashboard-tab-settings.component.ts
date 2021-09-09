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

import {
  Component,
  ChangeDetectionStrategy,
  Input,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  Output,
  OnInit,
} from '@angular/core';
import {
  DashboardCell,
  DashboardLayoutType,
  DashboardRow,
  DashboardTab,
  isDashboardTabDefault,
} from '../../../../../core/model/dashboard-tab';
import {BehaviorSubject, Observable} from 'rxjs';
import {filterValidDashboardCells, findRealDashboardCellIndexByValidIndex} from '../../../../utils/dashboard.utils';
import {AppState} from '../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {View} from '../../../../../core/store/views/view';
import {selectViewsByReadWithComputedData} from '../../../../../core/store/common/permissions.selectors';

@Component({
  selector: 'dashboard-tab-settings',
  templateUrl: './dashboard-tab-settings.component.html',
  styleUrls: ['./dashboard-tab-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTabSettingsComponent implements OnInit, OnChanges {
  @Input()
  public tab: DashboardTab;

  @Output()
  public tabChange = new EventEmitter<DashboardTab>();

  private selectedCoordinatesTabId: string;
  public selectedCoordinates$ = new BehaviorSubject<{row: number; column: number}>(null);

  public title: string;
  public isDefault: boolean;

  public views$: Observable<View[]>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.views$ = this.store$.pipe(select(selectViewsByReadWithComputedData));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.tab) {
      this.title = this.tab?.title || '';
      this.isDefault = isDashboardTabDefault(this.tab);
      this.checkTabCoordinates();
    }
  }

  private checkTabCoordinates() {
    if (this.selectedCoordinatesTabId && (!this.tab || this.tab.id !== this.selectedCoordinatesTabId)) {
      this.selectedCoordinates$.next(null);
    }
    this.selectedCoordinatesTabId = this.tab?.id;
  }

  public onNameBlur() {
    const tab = {...this.tab, title: this.title?.trim()};
    this.tabChange.emit(tab);
  }

  public revertName() {
    this.title = this.tab?.title || '';
  }

  public onShowChange(show: boolean) {
    const tab = {...this.tab, hidden: !show};
    this.tabChange.emit(tab);
  }

  public onRowChange(data: {row: DashboardRow; index: number}) {
    const newRows = [...(this.tab.rows || [])];
    newRows[data.index] = data.row;
    this.onRowsChange(newRows);

    const selectedRowIndex = this.selectedCoordinates$.value?.row;
    const selectedColumnIndex = this.selectedCoordinates$.value?.column;
    const validCells = filterValidDashboardCells(data.row.cells);
    if (selectedRowIndex === data.index && selectedColumnIndex >= validCells.length) {
      this.selectCell(data.index, validCells.length - 1);
    }
  }

  public onRowAdd(layout: DashboardLayoutType) {
    const newRows = [...(this.tab.rows || [])];
    const cells = layout.map(span => ({span}));
    newRows.push({cells});
    this.onRowsChange(newRows);
  }

  public onRowDelete(index: number) {
    const newRows = [...(this.tab.rows || [])];
    newRows.splice(index, 1);
    this.onRowsChange(newRows);

    if (this.selectedCoordinates$.value?.row === index) {
      this.selectedCoordinates$.next(null);
    }
  }

  public onRowsChange(rows: DashboardRow[]) {
    const tab = {...this.tab, rows};
    this.tabChange.emit(tab);
  }

  public selectCell(row: number, column: number) {
    this.selectedCoordinates$.next({row, column});
  }

  public onCellChange(cell: DashboardCell) {
    const rowIndex = this.selectedCoordinates$.value?.row;
    const row = this.tab?.rows?.[rowIndex];
    if (row) {
      const cellIndex = findRealDashboardCellIndexByValidIndex(row.cells, this.selectedCoordinates$.value.column);
      const cells = [...(row.cells || [])];
      cells[cellIndex] = cell;
      const newRow = {...row, cells};
      this.onRowChange({row: newRow, index: rowIndex});
    }
  }
}
