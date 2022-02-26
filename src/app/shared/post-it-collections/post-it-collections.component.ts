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

import {ChangeDetectionStrategy, Component, Input, OnChanges, OnInit, SimpleChanges} from '@angular/core';
import {Router} from '@angular/router';

import {select, Store} from '@ngrx/store';
import {map, switchMap, tap} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, Observable, of} from 'rxjs';
import {AppState} from '../../core/store/app.state';
import {Collection} from '../../core/store/collections/collection';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionsLoaded} from '../../core/store/collections/collections.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {queryContainsOnlyFulltexts, queryIsNotEmpty} from '../../core/store/navigation/query/query.util';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {
  selectCollectionsByCustomViewAndQuery,
  selectCollectionsPermissionsByView,
} from '../../core/store/common/permissions.selectors';
import {Query} from '../../core/store/navigation/query/query';
import {sortResourcesByFavoriteAndLastUsed} from '../utils/resource.utils';
import {selectCurrentView, selectViewQuery} from '../../core/store/views/views.state';
import {AllowedPermissions, AllowedPermissionsMap} from '../../core/model/allowed-permissions';
import {selectProjectPermissions} from '../../core/store/user-permissions/user-permissions.state';
import {View} from '../../core/store/views/view';
import {DataResourcesAction} from '../../core/store/data-resources/data-resources.action';

@Component({
  selector: 'post-it-collections',
  templateUrl: './post-it-collections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostItCollectionsComponent implements OnInit, OnChanges {
  @Input()
  public maxShown: number = -1;

  @Input()
  public showAddTaskTable: boolean;

  @Input()
  public view: View;

  public collections$: Observable<Collection[]>;
  public projectPermissions$: Observable<AllowedPermissions>;
  public collectionsPermissions$: Observable<AllowedPermissionsMap>;
  public query$: Observable<Query>;
  public view$: Observable<View>;
  public workspace$: Observable<Workspace>;
  public loaded$: Observable<boolean>;

  private isEmbedded: boolean;
  private query: Query;
  private overrideView$ = new BehaviorSubject<View>(null);

  constructor(private router: Router, private store$: Store<AppState>) {}

  public ngOnChanges(changes: SimpleChanges) {
    if (changes.view) {
      this.overrideView$.next(this.view);
    }
    this.isEmbedded = !!this.view;
  }

  public ngOnInit() {
    this.query$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return of(view.query);
        }
        return this.store$.pipe(select(selectViewQuery));
      }),
      tap(query => this.onQueryChanged(query))
    );
    this.view$ = this.overrideView$.pipe(
      switchMap(view => {
        if (view) {
          return of(view);
        }
        return this.store$.pipe(select(selectCurrentView));
      })
    );
    this.collections$ = combineLatest([this.view$, this.query$]).pipe(
      switchMap(([view, query]) => this.store$.pipe(select(selectCollectionsByCustomViewAndQuery(view, query)))),
      map(collections => sortResourcesByFavoriteAndLastUsed<Collection>(collections))
    );
    this.collectionsPermissions$ = this.view$.pipe(
      switchMap(view => this.store$.pipe(select(selectCollectionsPermissionsByView(view))))
    );

    this.projectPermissions$ = this.store$.pipe(select(selectProjectPermissions));
    this.workspace$ = this.store$.pipe(select(selectWorkspace));
    this.loaded$ = this.store$.pipe(select(selectCollectionsLoaded));
  }

  private onQueryChanged(query: Query) {
    this.query = query;

    if (queryContainsOnlyFulltexts(query)) {
      this.store$.dispatch(new DataResourcesAction.Get({query}));
    }
  }

  public onDelete(collection: Collection) {
    const title = $localize`:@@collection.delete.dialog.title:Delete?`;
    const message = $localize`:@@collection.delete.dialog.message:Do you really want to delete this table?`;

    this.store$.dispatch(
      new NotificationsAction.Confirm({
        title,
        message,
        action: new CollectionsAction.Delete({collectionId: collection.id}),
        type: 'danger',
      })
    );
  }

  public onUpdate(collection: Collection) {
    if (collection.id) {
      this.store$.dispatch(new CollectionsAction.Update({collection}));
    }
  }

  public onCreate(newCollection: Collection) {
    this.store$.dispatch(
      new CollectionsAction.Create({
        collection: newCollection,
        callback: collection => this.onCreateCollection(collection),
      })
    );
  }

  private onCreateCollection(collection: Collection) {
    if (queryIsNotEmpty(this.query)) {
      if (this.isEmbedded) {
        this.addCollectionToEmbeddedQuery(collection);
      } else {
        this.store$.dispatch(new NavigationAction.AddCollectionToQuery({collectionId: collection.id}));
      }
    }
  }

  private addCollectionToEmbeddedQuery(collection: Collection) {
    if (this.view) {
      const query = {...this.view.query, stems: [...this.view.query.stems, {collectionId: collection.id}]};
      this.overrideView$.next({...this.view, query});
    }
  }
}
