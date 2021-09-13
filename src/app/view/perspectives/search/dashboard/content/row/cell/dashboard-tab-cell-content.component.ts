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

import {Component, OnInit, ChangeDetectionStrategy, Input, OnChanges, SimpleChanges} from '@angular/core';
import {
  DashboardCell,
  DashboardCellType,
  DashboardImageCellConfig,
  DashboardViewCellConfig,
} from '../../../../../../../core/model/dashboard-tab';
import {View} from '../../../../../../../core/store/views/view';

@Component({
  selector: 'dashboard-tab-cell-content',
  templateUrl: './dashboard-tab-cell-content.component.html',
  styleUrls: ['./dashboard-tab-cell-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTabCellContentComponent implements OnChanges {
  @Input()
  public dashboardCell: DashboardCell;

  @Input()
  public views: View[];

  public readonly cellType = DashboardCellType;

  public url: string;
  public view: View;

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.dashboardCell || changes.views) {
      this.setupData();
    }
  }

  private setupData() {
    this.url = null;
    this.view = null;

    switch (this.dashboardCell?.type) {
      case DashboardCellType.Image:
        this.url = (<DashboardImageCellConfig>this.dashboardCell?.config)?.url;
        break;
      case DashboardCellType.View:
        const viewId = (<DashboardViewCellConfig>this.dashboardCell?.config)?.viewId;
        this.view = viewId && (this.views || []).find(view => view.id === viewId);
        break;
    }
  }
}
