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

import {Component, OnInit, ChangeDetectionStrategy, Input} from '@angular/core';
import {DashboardTab} from '../../../../../core/model/dashboard-tab';
import {AppState} from '../../../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {View} from '../../../../../core/store/views/view';
import {Observable} from 'rxjs';
import {selectViewsByRead} from '../../../../../core/store/common/permissions.selectors';

@Component({
  selector: 'dashboard-tab-content',
  templateUrl: './dashboard-tab-content.component.html',
  styleUrls: ['./dashboard-tab-content.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardTabContentComponent implements OnInit {
  @Input()
  public dashboardTab: DashboardTab;

  public views$: Observable<View[]>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.views$ = this.store$.pipe(select(selectViewsByRead));
  }
}
