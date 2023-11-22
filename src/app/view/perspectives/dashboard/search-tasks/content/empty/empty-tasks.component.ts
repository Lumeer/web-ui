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

import {Store, select} from '@ngrx/store';

import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';

import {AppState} from '../../../../../../core/store/app.state';
import {Collection} from '../../../../../../core/store/collections/collection';
import {selectAllDocumentsCount} from '../../../../../../core/store/documents/documents.state';
import {Query} from '../../../../../../core/store/navigation/query/query';
import {selectProjectPermissions} from '../../../../../../core/store/user-permissions/user-permissions.state';

@Component({
  selector: 'empty-tasks',
  templateUrl: './empty-tasks.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyTasksComponent implements OnInit {
  @Input()
  public query: Query;

  @Input()
  public collections: Collection[];

  @Input()
  public compact: boolean;

  public documentsCount$: Observable<number>;
  public hasWritePermission$: Observable<boolean>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.documentsCount$ = this.store$.pipe(select(selectAllDocumentsCount));
    this.hasWritePermission$ = this.store$.pipe(
      select(selectProjectPermissions),
      map(
        permissions =>
          permissions?.roles?.LinkContribute &&
          permissions?.roles?.CollectionContribute &&
          permissions?.roles?.ViewContribute
      )
    );
  }
}
