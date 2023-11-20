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
import {ChangeDetectionStrategy, Component, OnInit} from '@angular/core';

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';

import {AppState} from '../../../core/store/app.state';
import {Collection} from '../../../core/store/collections/collection';
import {selectAllCollections} from '../../../core/store/collections/collections.state';
import {selectWorkspaceWithIds} from '../../../core/store/common/common.selectors';
import {selectViewsByReadSorted} from '../../../core/store/common/permissions.selectors';
import {Workspace} from '../../../core/store/navigation/workspace';
import {Project} from '../../../core/store/projects/project';
import {selectProjectByWorkspace} from '../../../core/store/projects/projects.state';
import {View} from '../../../core/store/views/view';

@Component({
  selector: 'project-template',
  templateUrl: './project-template.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {class: 'd-block mt-4'},
})
export class ProjectTemplateComponent implements OnInit {
  public views$: Observable<View[]>;
  public project$: Observable<Project>;
  public collections$: Observable<Collection[]>;
  public workspace$: Observable<Workspace>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.views$ = this.store$.pipe(select(selectViewsByReadSorted));
    this.project$ = this.store$.pipe(select(selectProjectByWorkspace));
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.collections$ = this.store$.pipe(select(selectAllCollections));
  }
}
