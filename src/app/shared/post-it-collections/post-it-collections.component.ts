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

import {select, Store} from '@ngrx/store';
import {map, tap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {AppState} from '../../core/store/app.state';
import {Collection} from '../../core/store/collections/collection';
import {CollectionsAction} from '../../core/store/collections/collections.action';
import {selectCollectionsLoaded} from '../../core/store/collections/collections.state';
import {selectWorkspace} from '../../core/store/navigation/navigation.state';
import {Workspace} from '../../core/store/navigation/workspace';
import {NotificationsAction} from '../../core/store/notifications/notifications.action';
import {queryIsNotEmpty} from '../../core/store/navigation/query/query.util';
import {NavigationAction} from '../../core/store/navigation/navigation.action';
import {Router} from '@angular/router';
import {selectCollectionsByQuery} from '../../core/store/common/permissions.selectors';
import {Query} from '../../core/store/navigation/query/query';
import {CollectionImportData} from './content/import-button/post-it-collection-import-button.component';
import {sortResourcesByFavoriteAndLastUsed} from '../utils/resource.utils';
import {selectViewQuery} from '../../core/store/views/views.state';
import {AllowedPermissions} from '../../core/model/allowed-permissions';
import {selectProjectPermissions} from '../../core/store/user-permissions/user-permissions.state';

@Component({
  selector: 'post-it-collections',
  templateUrl: './post-it-collections.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostItCollectionsComponent implements OnInit {
  @Input()
  public maxShown: number = -1;

  @Input()
  public showAddTaskTable: boolean;

  public collections$: Observable<Collection[]>;
  public projectPermissions$: Observable<AllowedPermissions>;
  public query$: Observable<Query>;
  public workspace$: Observable<Workspace>;
  public loaded$: Observable<boolean>;

  private query: Query;

  constructor(private router: Router, private store$: Store<AppState>) {}

  public ngOnInit() {
    this.collections$ = this.store$.pipe(
      select(selectCollectionsByQuery),
      map(collections => sortResourcesByFavoriteAndLastUsed<Collection>(collections))
    );
    this.projectPermissions$ = this.store$.pipe(select(selectProjectPermissions));
    this.query$ = this.store$.pipe(
      select(selectViewQuery),
      tap(query => (this.query = query))
    );
    this.workspace$ = this.store$.pipe(select(selectWorkspace));
    this.loaded$ = this.store$.pipe(select(selectCollectionsLoaded));
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
      this.store$.dispatch(new NavigationAction.AddCollectionToQuery({collectionId: collection.id}));
    }
  }

  public onImport(data: {importData: CollectionImportData; emptyCollection: Collection}) {
    const {importData, emptyCollection} = data;
    const newCollection = {...emptyCollection, name: importData.name};
    const importedCollection = {collection: newCollection, data: importData.result};

    this.store$.dispatch(
      new CollectionsAction.Import({
        format: importData.format,
        importedCollection,
        callback: collection => this.onCreateCollection(collection),
      })
    );
  }
}
