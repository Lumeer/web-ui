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

import {Injectable, Pipe, PipeTransform} from '@angular/core';

import {select, Store} from '@ngrx/store';
import {combineLatest, Observable, of} from 'rxjs';
import {map, mergeMap} from 'rxjs/operators';
import {AppState} from '../../../core/store/app.state';
import {selectCurrentUserForWorkspace} from '../../../core/store/users/users.state';
import {authorRolesInView, userRolesInResource} from '../../utils/resource.utils';
import {User} from '../../../core/store/users/user';
import {selectCurrentView} from '../../../core/store/views/views.state';
import {View} from '../../../core/store/views/view';
import {selectAllLinkTypes} from '../../../core/store/link-types/link-types.state';
import {Collection} from '../../../core/store/collections/collection';
import {AllowedPermissions} from '../../../core/model/allowed-permissions';
import {Role} from '../../../core/model/role';
import {getAllCollectionIdsFromQuery} from '../../../core/store/navigation/query.util';
import {selectCurrentUserIsManager} from '../../../core/store/common/permissions.selectors';

@Pipe({
  name: 'collectionsPermissions',
  pure: false,
})
@Injectable({
  providedIn: 'root',
})
export class CollectionsPermissionsPipe implements PipeTransform {
  public constructor(private store$: Store<AppState>) {}

  public transform(collections: Collection[]): Observable<Record<string, AllowedPermissions>> {
    return this.store$.pipe(
      select(selectCurrentUserIsManager),
      mergeMap(isManager => {
        if (isManager) {
          return of(this.managePermissionsOfCollections(collections));
        }
        return this.checkCollectionsPermissionWithView(collections);
      })
    );
  }

  private managePermissionsOfCollections(collections: Collection[]): Record<string, AllowedPermissions> {
    return collections.reduce((obj, collection) => ({...obj, [collection.id]: this.managePermissions()}), {});
  }

  private managePermissions(): AllowedPermissions {
    return {read: true, write: true, manage: true, readWithView: true, writeWithView: true, manageWithView: true};
  }

  private checkCollectionsPermissionWithView(
    collections: Collection[]
  ): Observable<Record<string, AllowedPermissions>> {
    return combineLatest(
      this.store$.pipe(select(selectCurrentUserForWorkspace)),
      this.store$.pipe(select(selectCurrentView))
    ).pipe(
      mergeMap(([currentUser, currentView]) => {
        if (!currentUser) {
          return of({});
        }
        if (!currentView) {
          return of(this.checkCollectionsPermissions(collections, currentUser));
        }

        return this.getViewCollectionIds(currentView).pipe(
          map(collectionIdsInView =>
            collections.reduce((obj, collection) => {
              if (!collection) {
                return obj;
              }

              const userRoles = userRolesInResource(currentUser, collection);
              const read = userRoles.includes(Role.Read);
              const write = userRoles.includes(Role.Write);
              const manage = userRoles.includes(Role.Manage);

              const viewAllowedPermissions = collectionIdsInView.includes(collection.id)
                ? this.userPermissionsInView(currentUser, currentView, collection)
                : {};

              const readWithView = viewAllowedPermissions.readWithView || read;
              const writeWithView = viewAllowedPermissions.writeWithView || write;
              const manageWithView = viewAllowedPermissions.manageWithView || manage;

              const collectionPermissions = {read, write, manage, readWithView, writeWithView, manageWithView};
              return {...obj, [collection.id]: collectionPermissions};
            }, {})
          )
        );
      })
    );
  }

  private checkCollectionsPermissions(
    collections: Collection[],
    currentUser: User
  ): Record<string, AllowedPermissions> {
    return collections.reduce(
      (obj, collection) => ({...obj, [collection.id]: this.checkCollectionPermissions(collection, currentUser)}),
      {}
    );
  }

  private checkCollectionPermissions(collection: Collection, currentUser: User): AllowedPermissions {
    const userRoles = userRolesInResource(currentUser, collection);
    const read = userRoles.includes(Role.Read);
    const write = userRoles.includes(Role.Write);
    const manage = userRoles.includes(Role.Manage);
    return {read, write, manage, readWithView: read, writeWithView: write, manageWithView: manage};
  }

  private userPermissionsInView(user: User, view: View, collection: Collection): AllowedPermissions {
    const userRoles = userRolesInResource(user, view);
    const authorRoles = authorRolesInView(view, collection.id);

    const readWithView = userRoles.includes(Role.Read) && authorRoles.includes(Role.Read);
    const writeWithView = userRoles.includes(Role.Write) && authorRoles.includes(Role.Write);
    const manageWithView = userRoles.includes(Role.Manage) && authorRoles.includes(Role.Manage);

    return {readWithView, writeWithView, manageWithView};
  }

  private getViewCollectionIds(view: View): Observable<string[]> {
    return this.store$.pipe(
      select(selectAllLinkTypes),
      map(linkTypes => getAllCollectionIdsFromQuery(view.query, linkTypes))
    );
  }
}
