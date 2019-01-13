/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {Project} from '../../../../../../core/store/projects/project';
import {Organization} from '../../../../../../core/store/organizations/organization';
import {AppState} from '../../../../../../core/store/app.state';
import {Store} from '@ngrx/store';
import {Observable} from 'rxjs';
import {selectProjectsForWorkspace} from '../../../../../../core/store/projects/projects.state';
import {selectUsersForWorkspace} from '../../../../../../core/store/users/users.state';
import {filter, map} from 'rxjs/operators';
import {isNullOrUndefined} from 'util';
import {selectAllCollections} from '../../../../../../core/store/collections/collections.state';

@Component({
  selector: 'resource-status-line',
  templateUrl: './resource-status-line.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResourceStatusLineComponent implements OnChanges {
  @Input() public organization: Organization;
  @Input() public project: Project;

  public projectsCount$: Observable<number>;
  public usersCount$: Observable<number>;

  public collectionsCount$: Observable<number>;
  public documentsCount$: Observable<number>;

  constructor(private store: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges): void {
    if (this.organization) {
      this.projectsCount$ = this.store.select(selectProjectsForWorkspace).pipe(
        filter(projects => !isNullOrUndefined(projects)),
        map(projects => projects.length)
      );
      this.usersCount$ = this.store.select(selectUsersForWorkspace).pipe(
        filter(users => !isNullOrUndefined(users)),
        map(users => users.length)
      );
    }
    if (this.project) {
      this.collectionsCount$ = this.store.select(selectAllCollections).pipe(
        filter(collections => !isNullOrUndefined(collections)),
        map(collections => collections.length)
      );
      this.documentsCount$ = this.store.select(selectAllCollections).pipe(
        filter(collections => !isNullOrUndefined(collections)),
        map(collections => collections.map(collection => collection.documentsCount)),
        map(collections => (collections.length ? collections.reduce((total = 0, count) => total + count) : 0))
      );
    }
  }
}
