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

import {Component, EventEmitter, ChangeDetectionStrategy, Input, Output} from '@angular/core';
import {
  DashboardAction,
  DashboardCell,
  DashboardCellConfig,
  DashboardCellType,
} from '../../../../../../core/model/dashboard-tab';
import {SelectItemModel} from '../../../../../select/select-item/select-item.model';
import {objectValues} from '../../../../../utils/common.utils';
import {parseSelectTranslation} from '../../../../../utils/translation.utils';
import {View} from '../../../../../../core/store/views/view';

@Component({
  selector: 'dashboard-cell-settings',
  templateUrl: './dashboard-cell-settings.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardCellSettingsComponent {
  @Input()
  public cell: DashboardCell;

  @Input()
  public views: View[];

  @Output()
  public cellChange = new EventEmitter<DashboardCell>();

  public readonly type = DashboardCellType;
  public readonly typeItems: SelectItemModel[];

  constructor() {
    this.typeItems = objectValues(DashboardCellType).map(type => ({
      id: type,
      value: parseSelectTranslation(
        $localize`:@@search.tabs.settings.dialog.cell.type:{type, select, view {View} image {Image}}`,
        {type}
      ),
    }));
  }

  public onTypeSelected(type: DashboardCellType) {
    if (this.cell.type !== type) {
      const newCell = {...this.cell, type, config: {}};
      this.cellChange.emit(newCell);
    }
  }

  public onConfigChanged(config: DashboardCellConfig) {
    const newCell = {...this.cell, config};
    this.cellChange.emit(newCell);
  }

  public onActionsChange(actions: DashboardAction[]) {
    const newCell = {...this.cell, actions};
    this.cellChange.emit(newCell);
  }
}
