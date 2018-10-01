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

import {Injectable, Pipe, PipeTransform} from '@angular/core';
import {Store} from '@ngrx/store';
import {Observable, of, combineLatest as observableCombineLatest} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {AppState} from '../../core/store/app.state';
import {selectCurrentUserForWorkspace} from '../../core/store/users/users.state';
import {authorHasRoleInView, userHasRoleInResource} from '../utils/resource.utils';
import {UserModel} from '../../core/store/users/user.model';
import {selectCurrentView} from '../../core/store/views/views.state';
import {ViewModel} from '../../core/store/views/view.model';
import {selectAllLinkTypes} from '../../core/store/link-types/link-types.state';
import {CollectionModel} from '../../core/store/collections/collection.model';
import {selectAllDocuments} from '../../core/store/documents/documents.state';
import {getCollectionsIdsFromView} from '../../core/store/collections/collection.util';

@Pipe({
  name: 'collectionPermissions',
  pure: false
})
@Injectable({
  providedIn: 'root'
})
export class CollectionPermissionsPipe implements PipeTransform {

  public constructor(private store: Store<AppState>) {
  }

  public transform(collection: CollectionModel, role: string): Observable<boolean> {
    return this.store.select(selectCurrentUserForWorkspace).pipe(
      mergeMap(currentUser => {
        if (!currentUser || !collection) {
          return of(false);
        }

        const hasDirectAccess = userHasRoleInResource(currentUser, collection, role);
        if (hasDirectAccess) {
          return of(true);
        }

        return this.userHasRoleInView(currentUser, collection, role);
        // TODO check if author has role in resource
      })
    );
  }

  private userHasRoleInView(user: UserModel, collection: CollectionModel, role: string): Observable<boolean> {
    return this.store.select(selectCurrentView).pipe(
      mergeMap(view => {
        if (!view) {
          return of(false);
        }

        return this.viewContainsCollection(view, collection).pipe(
          map(contains => contains && userHasRoleInResource(user, view, role) && authorHasRoleInView(view, collection.id, role))
        );
      })
    );
  }

  private viewContainsCollection(view: ViewModel, collection: CollectionModel): Observable<boolean> {
    return this.getViewCollectionIds(view).pipe(
      map(collectionIds => collectionIds.includes(collection.id))
    );
  }

  private getViewCollectionIds(view: ViewModel): Observable<string[]> {
    return observableCombineLatest(
      this.store.select(selectAllLinkTypes),
      this.store.select(selectAllDocuments)
    ).pipe(
      map(([linkTypes, documents]) => getCollectionsIdsFromView(view, linkTypes, documents))
    );
  }

}
