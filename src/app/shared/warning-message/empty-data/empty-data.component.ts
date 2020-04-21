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

import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

import {Query} from '../../../core/store/navigation/query/query';
import {Project} from '../../../core/store/projects/project';
import {ResourceType} from '../../../core/model/resource-type';
import {AppState} from '../../../core/store/app.state';
import {select, Store} from '@ngrx/store';
import {selectWorkspace} from '../../../core/store/navigation/navigation.state';
import {take} from 'rxjs/operators';
import {Router} from '@angular/router';
import {Workspace} from '../../../core/store/navigation/workspace';
import {Perspective} from '../../../view/perspectives/perspective';
import {SearchTab} from '../../../core/store/navigation/search-tab';
import {QueryAction} from '../../../core/model/query-action';

@Component({
  selector: 'empty-data',
  templateUrl: './empty-data.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyDataComponent {
  @Input()
  public query: Query;

  @Input()
  public project: Project;

  public readonly projectType = ResourceType.Project;

  constructor(private store$: Store<AppState>, private router: Router) {}

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
