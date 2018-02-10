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
import {Actions, Effect} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {catchError, flatMap, map, switchMap, tap} from 'rxjs/operators';
import {Collection, Permission} from '../../dto';
import {CollectionService, SearchService} from '../../rest';
import {LinkTypesAction} from '../link-types/link-types.action';
import {QueryConverter} from '../navigation/query.converter';
import {NotificationsAction} from '../notifications/notifications.action';
import {PermissionsConverter} from '../permissions/permissions.converter';
import {PermissionType} from '../permissions/permissions.model';
import {CollectionConverter} from './collection.converter';
import {CollectionsAction, CollectionsActionType} from './collections.action';

@Injectable()
export class CollectionsEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.ofType<CollectionsAction.Get>(CollectionsActionType.GET).pipe(
    switchMap((action) => {
      const queryDto = QueryConverter.toDto(action.payload.query);

      return this.searchService.searchCollections(queryDto).pipe(
        map((dtos: Collection[]) => dtos.map(dto => CollectionConverter.fromDto(dto)))
      );
    }),
    map((collections) => new CollectionsAction.GetSuccess({collections: collections})),
    catchError((error) => Observable.of(new CollectionsAction.GetFailure({error: error})))
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.ofType<CollectionsAction.GetFailure>(CollectionsActionType.GET_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to get files'}))
  );

  @Effect()
  public getNames$: Observable<Action> = this.actions$.ofType<CollectionsAction.GetNames>(CollectionsActionType.GET_NAMES).pipe(
    switchMap(() => this.collectionService.getAllCollectionNames()),
    map((collectionNames) => new CollectionsAction.GetNamesSuccess({collectionNames})),
    catchError((error) => Observable.of(new CollectionsAction.GetNamesFailure({error: error})))
  );

  @Effect({dispatch: false})
  public getNamesFailure$: Observable<Action> = this.actions$.ofType<CollectionsAction.GetNamesFailure>(CollectionsActionType.GET_NAMES_FAILURE).pipe(
    tap((action: CollectionsAction.GetNamesFailure) => console.error(action.payload.error))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.ofType<CollectionsAction.Create>(CollectionsActionType.CREATE).pipe(
    switchMap(action => {
      const collectionDto = CollectionConverter.toDto(action.payload.collection);

      return this.collectionService.createCollection(collectionDto).pipe(
        map(collection => CollectionConverter.fromDto(collection, action.payload.collection.correlationId)),
        map(collection => ({collection, nextAction: action.payload.nextAction}))
      );
    }),
    flatMap(({collection, nextAction}) => {
      const actions: Action[] = [new CollectionsAction.CreateSuccess({collection})];
      if (nextAction && nextAction instanceof LinkTypesAction.Create) {
        nextAction.payload.linkType.collectionIds[1] = collection.id;
        actions.push(nextAction);
      }
      return actions;
    }),
    catchError((error) => Observable.of(new CollectionsAction.CreateFailure({error: error})))
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.ofType<CollectionsAction.CreateFailure>(CollectionsActionType.CREATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(action => new NotificationsAction.Error({message: 'Failed to create file'}))
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.ofType<CollectionsAction.Update>(CollectionsActionType.UPDATE).pipe(
    switchMap(action => {
      const collectionDto = CollectionConverter.toDto(action.payload.collection);

      return this.collectionService.createCollection(collectionDto).pipe(
        map((dto: Collection) => CollectionConverter.fromDto(dto))
      );
    }),
    map(collection => new CollectionsAction.CreateSuccess({collection: collection})),
    catchError((error) => Observable.of(new CollectionsAction.CreateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.ofType<CollectionsAction.UpdateFailure>(CollectionsActionType.UPDATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to update file'}))
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.ofType<CollectionsAction.Delete>(CollectionsActionType.DELETE).pipe(
    switchMap(action => this.collectionService.removeCollection(action.payload.collectionCode)),
    map(collectionCode => new CollectionsAction.DeleteSuccess({collectionCode: collectionCode})),
    catchError((error) => Observable.of(new CollectionsAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.ofType<CollectionsAction.DeleteFailure>(CollectionsActionType.DELETE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to delete file'}))
  );

  @Effect()
  public changeAttribute$: Observable<Action> = this.actions$.ofType<CollectionsAction.ChangeAttribute>(CollectionsActionType.CHANGE_ATTRIBUTE).pipe(
    switchMap(action => {
      const attributeDto = CollectionConverter.toAttributeDto(action.payload.attribute);

      return this.collectionService.updateAttribute(action.payload.collectionCode, action.payload.attributeId, attributeDto).pipe(
        map(result => ({action, attribute: CollectionConverter.fromAttributeDto(result)}))
      );
    }),
    map(({action, attribute}) => new CollectionsAction.ChangeAttributeSuccess(
      {collectionCode: action.payload.collectionCode, attributeId: action.payload.attributeId, attribute: attribute}
    )),
    catchError((error) => Observable.of(new CollectionsAction.ChangeAttributeFailure({error: error})))
  );

  @Effect()
  public changeAttributeFailure$: Observable<Action> = this.actions$
    .ofType<CollectionsAction.ChangeAttributeFailure>(CollectionsActionType.CHANGE_ATTRIBUTE_FAILURE).pipe(
      tap(action => console.error(action.payload.error)),
      map(() => new NotificationsAction.Error({message: 'Failed to change attribute'}))
    );

  @Effect()
  public removeAttribute$: Observable<Action> = this.actions$.ofType<CollectionsAction.RemoveAttribute>(CollectionsActionType.REMOVE_ATTRIBUTE).pipe(
    switchMap(action => this.collectionService.removeAttribute(action.payload.collectionCode, action.payload.attributeId).pipe(
      map(() => action)
    )),
    map(action => new CollectionsAction.RemoveAttributeSuccess(action.payload)),
    catchError((error) => Observable.of(new CollectionsAction.RemoveAttributeFailure({error: error})))
  );

  @Effect()
  public removeAttributeFailure$: Observable<Action> = this.actions$
    .ofType<CollectionsAction.RemoveAttributeFailure>(CollectionsActionType.REMOVE_ATTRIBUTE_FAILURE).pipe(
      tap(action => console.error(action.payload.error)),
      map(() => new NotificationsAction.Error({message: 'Failed to remove attribute'}))
    );

  @Effect()
  public changePermission$: Observable<Action> = this.actions$.ofType<CollectionsAction.ChangePermission>(CollectionsActionType.CHANGE_PERMISSION).pipe(
    switchMap(action => {
      const permissionDto: Permission = PermissionsConverter.toPermissionDto(action.payload.permission);

      if (action.payload.type === PermissionType.Users) {
        return this.collectionService.updateUserPermission(permissionDto).pipe(
          map(permission => ({action, permission: PermissionsConverter.fromPermissionDto(permission)}))
        );
      } else {
        return this.collectionService.updateGroupPermission(permissionDto).pipe(
          map(permission => ({action, permission: PermissionsConverter.fromPermissionDto(permission)}))
        );
      }
    }),
    map(({action, permission}) => new CollectionsAction.ChangePermissionSuccess(
      {collectionCode: action.payload.collectionCode, type: action.payload.type, permission: permission}
    )),
    catchError((error) => Observable.of(new CollectionsAction.ChangePermissionFailure({error: error})))
  );

  @Effect()
  public changePermissionFailure$: Observable<Action> = this.actions$
    .ofType<CollectionsAction.ChangePermissionFailure>(CollectionsActionType.CHANGE_PERMISSION_FAILURE).pipe(
      tap(action => console.error(action.payload.error)),
      map(() => new NotificationsAction.Error({message: 'Failed to change permission'}))
    );

  @Effect()
  public removePermission$: Observable<Action> = this.actions$.ofType<CollectionsAction.RemovePermission>(CollectionsActionType.REMOVE_PERMISSION).pipe(
    switchMap(action => {
      if (action.payload.type === PermissionType.Users) {
        return this.collectionService.removeUserPermission(action.payload.name).pipe(map(() => action));
      } else {
        return this.collectionService.removeGroupPermission(action.payload.name).pipe(map(() => action));
      }
    }),
    map(action => new CollectionsAction.RemovePermissionSuccess(action.payload)),
    catchError((error) => Observable.of(new CollectionsAction.RemovePermissionFailure({error: error})))
  );

  @Effect()
  public removePermissionFailure$: Observable<Action> = this.actions$
    .ofType<CollectionsAction.RemovePermissionFailure>(CollectionsActionType.REMOVE_PERMISSION_FAILURE).pipe(
      tap(action => console.error(action.payload.error)),
      map(() => new NotificationsAction.Error({message: 'Failed to remove permission'}))
    );

  constructor(private actions$: Actions,
              private collectionService: CollectionService,
              private searchService: SearchService) {
  }

}
