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

import {ChangeDetectionStrategy, Component, Input, OnInit} from '@angular/core';

import {Query} from '../../../core/store/navigation/query/query';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {take} from 'rxjs/operators';
import {Router} from '@angular/router';
import {Workspace} from '../../../core/store/navigation/workspace';
import {Perspective} from '../../../view/perspectives/perspective';
import {SearchTab} from '../../../core/store/navigation/search-tab';
import {QueryAction} from '../../../core/model/query-action';
import {Observable} from 'rxjs';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {selectProjectPermissions} from '../../../core/store/user-permissions/user-permissions.state';

@Component({
  selector: 'empty-data',
  templateUrl: './empty-data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyDataComponent implements OnInit {
  @Input()
  public query: Query;

  public projectPermissions$: Observable<AllowedPermissions>;

  constructor(public router: Router, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.projectPermissions$ = this.store$.pipe(select(selectProjectPermissions));
  }

  public onSwitchToCollectionsTab() {
    this.store$.pipe(select(selectWorkspace), take(1)).subscribe(workspace => this.switchToCollectionsTab(workspace));
  }

  private switchToCollectionsTab(workspace: Workspace) {
    if (workspace) {
      this.router.navigate(
        ['w', workspace.organizationCode, workspace.projectCode, 'view', Perspective.Search, SearchTab.Collections],
        {
          queryParams: {action: QueryAction.CreateCollection},
        }
      );
    }
  }
}
