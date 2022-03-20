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

import {Component, OnInit, ChangeDetectionStrategy} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {select, Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Workspace} from '../../../core/store/navigation/workspace';
import {AppState} from '../../../core/store/app.state';
import {selectWorkspaceWithIds} from '../../../core/store/common/common.selectors';
import {selectProjectsForWorkspace} from '../../../core/store/projects/projects.state';
import {SelectItemModel} from '../../../shared/select/select-item/select-item.model';
import {projectSelectItems} from '../../../shared/select/select-item.utils';

@Component({
  templateUrl: './workspace-user-activity.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WorkspaceUserActivityComponent implements OnInit {
  public workspace$: Observable<Workspace>;
  public projectItems$: Observable<SelectItemModel[]>;

  constructor(private store$: Store<AppState>, private router: Router, private route: ActivatedRoute) {}

  public ngOnInit() {
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.projectItems$ = this.store$.pipe(
      select(selectProjectsForWorkspace),
      map(projects => projectSelectItems(projects, project => project.code))
    );
  }

  public onProjectSelect(value: string) {
    this.router.navigate([], {queryParams: {projectCode: value}, relativeTo: this.route, queryParamsHandling: 'merge'});
  }
}
