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
import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';

import {
  DashboardCell,
  DashboardCellType,
  DashboardImageCellConfig,
  DashboardImageScaleType,
  DashboardViewCellConfig,
  defaultDashboardImageScaleType,
} from '../../../../../../../core/model/dashboard-tab';
import {AppState} from '../../../../../../../core/store/app.state';
import {
  DashboardData,
  DashboardDataType,
  DashboardNotesCellData,
} from '../../../../../../../core/store/dashboard-data/dashboard-data';
import {selectDashboardDataByType} from '../../../../../../../core/store/dashboard-data/dashboard-data.state';
import {Query} from '../../../../../../../core/store/navigation/query/query';
import {View} from '../../../../../../../core/store/views/view';
import {addQueryFiltersToView} from '../../../../../../../core/store/views/view.utils';
import {objectChanged} from '../../../../../../../shared/utils/common.utils';
import {PerspectiveConfiguration} from '../../../../../perspective-configuration';
import * as DashboardDataActions from './../../../../../../../core/store/dashboard-data/dashboard-data.actions';

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

  @Input()
  public query: Query;

  public readonly cellType = DashboardCellType;
  public readonly configuration: PerspectiveConfiguration = {
    pivot: {},
    kanban: {},
    chart: {},
    map: {},
    calendar: {},
    gantt: {},
    workflow: {showSidebar: true, showHiddenColumns: true},
    detail: {},
    form: {showSidebar: false},
  };

  public computedType: DashboardCellType;
  public url: string;
  public scale: DashboardImageScaleType;
  public view: View;

  public cellData$: Observable<DashboardData>;

  constructor(private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.dashboardCell || changes.views || changes.query) {
      this.setupData();
    }
    if (objectChanged(changes.dashboardCell)) {
      this.cellData$ = this.store$.pipe(
        select(selectDashboardDataByType(DashboardDataType.Cell, this.dashboardCell.id))
      );
    }
  }

  private setupData() {
    this.url = null;
    this.view = null;

    switch (this.dashboardCell?.type) {
      case DashboardCellType.Image:
        this.url = (<DashboardImageCellConfig>this.dashboardCell?.config)?.url;
        this.scale = (<DashboardImageCellConfig>this.dashboardCell?.config)?.scale || defaultDashboardImageScaleType;
        this.computedType = DashboardCellType.Image;
        break;
      case DashboardCellType.View:
        const viewId = (<DashboardViewCellConfig>this.dashboardCell?.config)?.viewId;
        this.view = viewId && (this.views || []).find(view => view.id === viewId);
        this.view = addQueryFiltersToView(this.view, this.query);
        if (this.view) {
          this.computedType = DashboardCellType.View;
        } else {
          this.computedType = null;
        }
        break;
      case DashboardCellType.Notes:
        this.computedType = DashboardCellType.Notes;
        break;
    }
  }

  public onDataChange(data: DashboardNotesCellData) {
    const dashboardData: DashboardData = {type: DashboardDataType.Cell, typeId: this.dashboardCell.id, data};
    this.store$.dispatch(DashboardDataActions.update({dashboardData}));
  }
}
