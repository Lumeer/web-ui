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
import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs/Observable';
import {catchError, flatMap, map, mergeMap, tap} from 'rxjs/operators';
import {Collection, Permission} from '../../dto';
import {CollectionService, ImportService, SearchService} from '../../rest';
import {HomePageService} from '../../rest/home-page.service';
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
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.Get>(CollectionsActionType.GET),
    mergeMap((action) => {
      const queryDto = QueryConverter.toDto(action.payload.query);

      return this.searchService.searchCollections(queryDto).pipe(
        map((dtos: Collection[]) => dtos.map(dto => CollectionConverter.fromDto(dto)))
      );
    }),
    map((collections) => new CollectionsAction.GetSuccess({collections: collections})),
    catchError((error) => Observable.of(new CollectionsAction.GetFailure({error: error})))
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.GetFailure>(CollectionsActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'collections.get.fail', value: 'Failed to get files'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public getNames$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.GetNames>(CollectionsActionType.GET_NAMES),
    mergeMap(() => this.collectionService.getAllCollectionNames()),
    map((collectionNames) => new CollectionsAction.GetNamesSuccess({collectionNames})),
    catchError((error) => Observable.of(new CollectionsAction.GetNamesFailure({error: error})))
  );

  @Effect({dispatch: false})
  public getNamesFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.GetNamesFailure>(CollectionsActionType.GET_NAMES_FAILURE),
    tap((action: CollectionsAction.GetNamesFailure) => console.error(action.payload.error))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.Create>(CollectionsActionType.CREATE),
    mergeMap(action => {
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
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.CreateFailure>(CollectionsActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'collection.create.fail', value: 'Failed to create file'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public import$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.Import>(CollectionsActionType.IMPORT),
    mergeMap(action => {
      return this.importService.importFile(action.payload.format, action.payload.importedCollection).pipe(
        map(collection => CollectionConverter.fromDto(collection))
      );
    }),
    map(collection => new CollectionsAction.ImportSuccess({collection: collection})),
    catchError((error) => Observable.of(new CollectionsAction.ImportFailure({error: error})))
  );

  @Effect()
  public importFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.ImportFailure>(CollectionsActionType.IMPORT_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'collection.import.fail', value: 'Failed to import file'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.Update>(CollectionsActionType.UPDATE),
    mergeMap(action => {
      const collectionDto = CollectionConverter.toDto(action.payload.collection);

      return this.collectionService.updateCollection(collectionDto).pipe(
        map((dto: Collection) => CollectionConverter.fromDto(dto))
      );
    }),
    map(collection => new CollectionsAction.UpdateSuccess({collection: collection})),
    catchError((error) => Observable.of(new CollectionsAction.CreateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.UpdateFailure>(CollectionsActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'collection.update.fail', value: 'Failed to update file'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.Delete>(CollectionsActionType.DELETE),
    mergeMap(action => this.collectionService.removeCollection(action.payload.collectionId)),
    map(collectionId => new CollectionsAction.DeleteSuccess({collectionId})),
    catchError((error) => Observable.of(new CollectionsAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.DeleteFailure>(CollectionsActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'collection.delete.fail', value: 'Failed to delete file'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public addFavorite$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.AddFavorite>(CollectionsActionType.ADD_FAVORITE),
    mergeMap(action => this.homePageService.addFavoriteCollection(action.payload.collectionId).pipe(
      map(() => action.payload.collectionId)
    )),
    map((collectionId) => new CollectionsAction.AddFavoriteSuccess({collectionId})),
    catchError((error) => Observable.of(new CollectionsAction.AddFavoriteFailure({error: error})))
  );

  @Effect()
  public addFavoriteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.AddFavoriteFailure>(CollectionsActionType.ADD_FAVORITE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'collection.add.favorite.fail', value: 'Failed to add favorite file'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public removeFavorite$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.RemoveFavorite>(CollectionsActionType.REMOVE_FAVORITE),
    mergeMap(action => this.homePageService.removeFavoriteCollection(action.payload.collectionId).pipe(
      map(() => action.payload.collectionId)
    )),
    map((collectionId) => new CollectionsAction.RemoveFavoriteSuccess({collectionId})),
    catchError((error) => Observable.of(new CollectionsAction.RemoveFavoriteFailure({error: error})))
  );

  @Effect()
  public removeFavoriteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.RemoveFavoriteFailure>(CollectionsActionType.REMOVE_FAVORITE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'collection.remove.favorite.fail', value: 'Failed to remove favorite file'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public changeAttribute$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.ChangeAttribute>(CollectionsActionType.CHANGE_ATTRIBUTE),
    mergeMap(action => {
      const attributeDto = CollectionConverter.toAttributeDto(action.payload.attribute);

      return this.collectionService.updateAttribute(action.payload.collectionId, action.payload.attributeId, attributeDto).pipe(
        map(result => ({action, attribute: CollectionConverter.fromAttributeDto(result)}))
      );
    }),
    flatMap(({action, attribute}) => {
      const actions: Action[] = [new CollectionsAction.ChangeAttributeSuccess(
        {collectionId: action.payload.collectionId, attributeId: action.payload.attributeId, attribute: attribute}
      )];
      if (action.payload.nextAction) {
        actions.push(action.payload.nextAction);
      }
      return actions;
    }),
    catchError((error) => Observable.of(new CollectionsAction.ChangeAttributeFailure({error: error})))
  );

  @Effect()
  public changeAttributeFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.ChangeAttributeFailure>(CollectionsActionType.CHANGE_ATTRIBUTE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'collection.change.attribute.fail', value: 'Failed to change attribute'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public removeAttribute$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.RemoveAttribute>(CollectionsActionType.REMOVE_ATTRIBUTE),
    mergeMap(action => this.collectionService.removeAttribute(action.payload.collectionId, action.payload.attributeId).pipe(
      map(() => action)
    )),
    map(action => new CollectionsAction.RemoveAttributeSuccess(action.payload)),
    catchError((error) => Observable.of(new CollectionsAction.RemoveAttributeFailure({error: error})))
  );

  @Effect()
  public removeAttributeFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.RemoveAttributeFailure>(CollectionsActionType.REMOVE_ATTRIBUTE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'collection.remove.attribute.fail', value: 'Failed to remove attribute'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public changePermission$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.ChangePermission>(CollectionsActionType.CHANGE_PERMISSION),
    mergeMap(action => {
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
      {collectionId: action.payload.collectionId, type: action.payload.type, permission: permission}
    )),
    catchError((error) => Observable.of(new CollectionsAction.ChangePermissionFailure({error: error})))
  );

  @Effect()
  public changePermissionFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.ChangePermissionFailure>(CollectionsActionType.CHANGE_PERMISSION_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'collection.change.permission.fail', value: 'Failed to change file permission'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public removePermission$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.RemovePermission>(CollectionsActionType.REMOVE_PERMISSION),
    mergeMap(action => {
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
  public removePermissionFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.RemovePermissionFailure>(CollectionsActionType.REMOVE_PERMISSION_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'collection.remove.permission.fail', value: 'Failed to remove file permission'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(private actions$: Actions,
              private collectionService: CollectionService,
              private homePageService: HomePageService,
              private i18n: I18n,
              private importService: ImportService,
              private searchService: SearchService) {
  }

}
