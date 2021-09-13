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

import {Component, ChangeDetectionStrategy, OnInit} from '@angular/core';
import {AppState} from '../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {DashboardTab} from '../../../../core/model/dashboard-tab';
import {combineLatest, Observable} from 'rxjs';
import {Dashboard} from '../../../../core/store/searches/search';
import {selectSearchConfig} from '../../../../core/store/searches/searches.state';
import {map} from 'rxjs/operators';
import {selectSearchTab} from '../../../../core/store/navigation/navigation.state';

@Component({
  templateUrl: './dashboard-tab.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTabComponent implements OnInit {
  public dashboardTab$: Observable<DashboardTab>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.dashboardTab$ = combineLatest([this.store$.pipe(select(selectSearchTab)), this.selectDashboard$()]).pipe(
      map(([tabId, dashboard]) => dashboard?.tabs?.find(tab => tab.id === tabId))
    );
  }

  private selectDashboard$(): Observable<Dashboard> {
    return this.store$.pipe(
      select(selectSearchConfig),
      map(config => config?.dashboard)
    );
  }
}
