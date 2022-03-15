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
import {Observable} from 'rxjs';
import {select, Store} from '@ngrx/store';
import {Workspace} from '../../../../core/store/navigation/workspace';
import {ResourceType} from '../../../../core/model/resource-type';
import {Project} from '../../../../core/store/projects/project';
import {AppState} from '../../../../core/store/app.state';
import {selectCollectionByWorkspace} from '../../../../core/store/collections/collections.state';
import {selectWorkspaceWithIds} from '../../../../core/store/common/common.selectors';

@Component({
  selector: 'collection-activity',
  templateUrl: './collection-activity.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionActivityComponent implements OnInit {
  public collection$: Observable<Project>;
  public workspace$: Observable<Workspace>;

  public readonly resourceType = ResourceType.Collection;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.collection$ = this.store$.pipe(select(selectCollectionByWorkspace));
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
  }
}
