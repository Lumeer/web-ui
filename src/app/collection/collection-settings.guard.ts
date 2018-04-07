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

import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';

import {CollectionService} from '../core/rest';
import {Observable} from 'rxjs/Observable';
import {catchError, map, mergeMap, take, tap, withLatestFrom} from 'rxjs/operators';
import {selectAllCollections} from "../core/store/collections/collections.state";
import {Store} from "@ngrx/store";
import {AppState} from '../core/store/app.state';
import {CollectionModel} from '../core/store/collections/collection.model';
import {CollectionConverter} from '../core/store/collections/collection.converter';
import {CollectionsAction} from '../core/store/collections/collections.action';
import {isNullOrUndefined} from 'util';
import {OrganizationModel} from '../core/store/organizations/organization.model';
import {NotificationsAction} from '../core/store/notifications/notifications.action';
import {UsersAction} from '../core/store/users/users.action';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {selectAllOrganizations} from '../core/store/organizations/organizations.state';
import {userHasManageRoleInResource} from '../shared/utils/resource.utils';
import {selectCurrentUserForWorkspace} from '../core/store/users/users.state';

@Injectable()
export class CollectionSettingsGuard implements CanActivate {

  constructor(private i18n: I18n,
              private router: Router,
              private collectionService: CollectionService,
              private store: Store<AppState>) {
  }

  public canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> {
    const organizationCode = next.paramMap.get("organizationCode");
    const collectionId = next.paramMap.get('collectionId');

    return this.getCollectionFromStoreOrApi(collectionId).pipe(
      withLatestFrom(this.store.select(selectAllOrganizations)),
      withLatestFrom(this.store.select(selectCurrentUserForWorkspace)),
      mergeMap(([[collection, organizations], user]) => {
        if (isNullOrUndefined(collection)) {
          this.dispatchErrorActionsNotExist();
          return Observable.of(false);
        }

        if (!userHasManageRoleInResource(user, collection)) {
          this.dispatchErrorActionsNotPermission();
          return Observable.of(false);
        }

        const organization = organizations.find(org => org.code === organizationCode);
        this.dispatchDataEvents(organization, collection);
        return Observable.of(true);
      })
    );
  }


  private dispatchErrorActionsNotExist() {
    const message = this.i18n({id: 'file.not.exist', value: 'File does not exist'});
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActionsNotPermission() {
    const message = this.i18n({
      id: 'file.permission.missing',
      value: 'You do not have permission to access this file'
    });
    this.dispatchErrorActions(message);
  }

  private dispatchErrorActions(message: string) {
    this.router.navigate(['/workspace']);
    this.store.dispatch(new NotificationsAction.Error({message}));
  }

  private dispatchDataEvents(organization: OrganizationModel, collection: CollectionModel) {
    this.store.dispatch(new UsersAction.Get({organizationId: organization.id}));
    this.store.dispatch(new CollectionsAction.GetPermissions({collectionId: collection.id}));
    //this.store.dispatch(new GroupsAction.Get());
  }

  public getCollectionFromStoreOrApi(id: string): Observable<CollectionModel> {
    return this.getCollectionFromStore(id).pipe(
      mergeMap(collection => {
        if (!isNullOrUndefined(collection)) {
          return Observable.of(collection);
        }
        return this.getCollectionFromApi(id);
      })
    );
  }

  private getCollectionFromApi(id: string): Observable<CollectionModel> {
    return this.collectionService.getCollection(id).pipe(
      map(collection => CollectionConverter.fromDto(collection)),
      tap(collection => this.store.dispatch(new CollectionsAction.GetOneSuccess({collection}))),
      catchError(() => {
        return Observable.of(undefined);
      })
    );
  }

  private getCollectionFromStore(id: string): Observable<CollectionModel> {
    return this.store.select(selectAllCollections).pipe(
      map(collections => collections.find(coll => coll.id === id)),
      take(1)
    );
  }

}
