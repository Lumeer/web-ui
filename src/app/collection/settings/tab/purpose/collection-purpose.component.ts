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
import {filter} from 'rxjs/operators';

import {isNotNullOrUndefined} from '@lumeer/utils';

import {AppState} from '../../../../core/store/app.state';
import {Collection} from '../../../../core/store/collections/collection';
import {selectCollectionByWorkspace} from '../../../../core/store/collections/collections.state';
import {selectWorkspaceWithIds} from '../../../../core/store/common/common.selectors';
import {Workspace} from '../../../../core/store/navigation/workspace';

@Component({
  selector: 'collection-purpose',
  templateUrl: './collection-purpose.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionPurposeComponent implements OnInit {
  public collection$: Observable<Collection>;
  public workspace$: Observable<Workspace>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.subscribeData();
  }

  private subscribeData() {
    this.workspace$ = this.store$.pipe(select(selectWorkspaceWithIds));
    this.collection$ = this.store$
      .select(selectCollectionByWorkspace)
      .pipe(filter(collection => isNotNullOrUndefined(collection)));
  }
}
