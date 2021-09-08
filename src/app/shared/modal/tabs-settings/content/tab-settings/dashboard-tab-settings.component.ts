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

import {Component, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges, EventEmitter, Output} from '@angular/core';
import {DashboardRow, DashboardTab, isDashboardTabDefault} from '../../../../../core/model/dashboard-tab';

@Component({
  selector: 'dashboard-tab-settings',
  templateUrl: './dashboard-tab-settings.component.html',
  styleUrls: ['./dashboard-tab-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DashboardTabSettingsComponent implements OnChanges {

  @Input()
  public tab: DashboardTab;

  @Output()
  public tabChange = new EventEmitter<DashboardTab>();

  public title: string;
  public isDefault: boolean;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.tab) {
      this.title = this.tab?.title || '';
      this.isDefault = isDashboardTabDefault(this.tab);
    }
  }

  public onNameBlur() {
    const tab = {...this.tab, title: this.title?.trim()};
    this.tabChange.emit(tab);
  }

  public onShowChange(show: boolean) {
    const tab = {...this.tab, hidden: !show};
    this.tabChange.emit(tab);
  }

  public onRowsChange(rows: DashboardRow[]) {
    const tab = {...this.tab, rows};
    this.tabChange.emit(tab);
  }
}
