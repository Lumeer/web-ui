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

import {Component, ChangeDetectionStrategy, Input, SimpleChanges, OnInit, OnChanges} from '@angular/core';
import {Observable, combineLatest} from 'rxjs';
import {Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {View} from '../../../../core/store/views/view';
import {select, Store} from '@ngrx/store';
import {AppState} from '../../../../core/store/app.state';
import {selectAllCollections, selectCollectionsLoaded} from '../../../../core/store/collections/collections.state';
import {
  selectLinkTypesLoaded,
  selectLinkTypesWithCollections,
} from '../../../../core/store/link-types/link-types.state';
import {selectViewsLoaded, selectViewsWithComputedData} from '../../../../core/store/views/views.state';
import {Organization} from '../../../../core/store/organizations/organization';
import {Project} from '../../../../core/store/projects/project';
import {selectOrganizationById} from '../../../../core/store/organizations/organizations.state';
import {selectProjectById} from '../../../../core/store/projects/projects.state';
import {User} from '../../../../core/store/users/user';
import {mapGroupsOnUser, selectCurrentUser, selectUserByWorkspace} from '../../../../core/store/users/users.state';
import {selectTeamsByOrganization} from '../../../../core/store/teams/teams.state';
import {map} from 'rxjs/operators';
import {ResourcesAction} from '../../../../core/store/resources/data-resources.action';
import {sortResourcesByFavoriteAndLastUsed} from '../../../../shared/utils/resource.utils';

@Component({
  selector: 'user-resources',
  templateUrl: './user-resources.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserResourcesComponent implements OnInit, OnChanges {
  @Input()
  public organizationId: string;

  @Input()
  public projectId: string;

  public organization$: Observable<Organization>;
  public project$: Observable<Project>;
  public user$: Observable<User>;
  public isCurrentUser$: Observable<boolean>;

  public collections$: Observable<Collection[]>;
  public collectionsLoaded$: Observable<boolean>;

  public linkTypes$: Observable<LinkType[]>;
  public linkTypesLoaded$: Observable<boolean>;

  public views$: Observable<View[]>;
  public viewsLoaded$: Observable<boolean>;

  constructor(private store$: Store<AppState>) {}

  public ngOnInit() {
    this.collections$ = this.store$.pipe(
      select(selectAllCollections),
      map(collections => sortResourcesByFavoriteAndLastUsed(collections))
    );
    this.collectionsLoaded$ = this.store$.pipe(select(selectCollectionsLoaded));

    this.linkTypes$ = this.store$.pipe(select(selectLinkTypesWithCollections));
    this.linkTypesLoaded$ = this.store$.pipe(select(selectLinkTypesLoaded));

    this.views$ = this.store$.pipe(
      select(selectViewsWithComputedData),
      map(views => sortResourcesByFavoriteAndLastUsed(views))
    );
    this.viewsLoaded$ = this.store$.pipe(select(selectViewsLoaded));

    this.isCurrentUser$ = combineLatest([
      this.store$.pipe(select(selectUserByWorkspace)),
      this.store$.pipe(select(selectCurrentUser)),
    ]).pipe(map(([user, currentUser]) => user?.id === currentUser?.id));
  }

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.organizationId) {
      this.organization$ = this.store$.pipe(select(selectOrganizationById(this.organizationId)));
      this.user$ = combineLatest([
        this.store$.pipe(select(selectUserByWorkspace)),
        this.store$.pipe(select(selectTeamsByOrganization(this.organizationId))),
      ]).pipe(map(([user, teams]) => mapGroupsOnUser(user, teams)));
    }
    if (changes.projectId) {
      this.project$ = this.store$.pipe(select(selectProjectById(this.projectId)));
    }

    if (changes.organizationId || changes.projectId) {
      this.fetchData();
    }
  }

  private fetchData() {
    this.store$.dispatch(new ResourcesAction.Get({organizationId: this.organizationId, projectId: this.projectId}));
  }
}
