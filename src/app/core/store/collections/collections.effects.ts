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
import {Action, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs/Observable';
import {catchError, concatMap, filter, flatMap, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
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
import {selectCollectionsLoaded} from "./collections.state";
import {AppState} from "../app.state";
import {HttpErrorResponse} from "@angular/common/http";
import {RouterAction} from "../router/router.action";
import {selectOrganizationByWorkspace} from "../organizations/organizations.state";
import {DocumentsAction} from '../documents/documents.action';

@Injectable()
export class CollectionsEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.Get>(CollectionsActionType.GET),
    withLatestFrom(this.store$.select(selectCollectionsLoaded)),
    filter(([action, loaded]) => !loaded),
    map(([action]) => action),
    mergeMap((action) => {
      const queryDto = QueryConverter.toDto(action.payload.query);

      return this.searchService.searchCollections(queryDto, action.payload.workspace).pipe(
        map((dtos: Collection[]) => dtos.map(dto => CollectionConverter.fromDto(dto))),
        map((collections) => new CollectionsAction.GetSuccess({collections: collections})),
        catchError((error) => Observable.of(new CollectionsAction.GetFailure({error: error})))
      );
    })
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
    mergeMap(() => this.collectionService.getAllCollectionNames().pipe(
      map((collectionNames) => new CollectionsAction.GetNamesSuccess({collectionNames})),
      catchError((error) => Observable.of(new CollectionsAction.GetNamesFailure({error: error})))
    ))
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
        map(collection => ({collection, nextAction: action.payload.nextAction})),
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
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.CreateFailure>(CollectionsActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    withLatestFrom(this.store$.select(selectOrganizationByWorkspace)),
    map(([action, organization]) => {
      if (action.payload.error instanceof HttpErrorResponse && action.payload.error.status == 402) {
        const title = this.i18n({id: 'serviceLimits.trial', value: 'Free Service'});
        const message = this.i18n({
          id: 'collection.create.serviceLimits',
          value: 'You are currently on the Free plan which allows you to have only limited number of files. Do you want to upgrade to Business now?'
        });
        return new NotificationsAction.Confirm({
          title,
          message,
          action: new RouterAction.Go({
            path: ['/organization', organization.code, 'detail'],
            extras: {fragment: 'orderService'}
          })
        });
      }
      const message = this.i18n({id: 'collection.create.fail', value: 'Failed to create file'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public import$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.Import>(CollectionsActionType.IMPORT),
    mergeMap(action => {
      return this.importService.importFile(action.payload.format, action.payload.importedCollection).pipe(
        map(collection => CollectionConverter.fromDto(collection)),
        map(collection => new CollectionsAction.ImportSuccess({collection: collection})),
        catchError((error) => Observable.of(new CollectionsAction.ImportFailure({error: error})))
      );
    })
  );

  @Effect()
  public importFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.ImportFailure>(CollectionsActionType.IMPORT_FAILURE),
    tap(action => console.error(action.payload.error)),
    withLatestFrom(this.store$.select(selectOrganizationByWorkspace)),
    map(([action, organization]) => {
      if (action.payload.error instanceof HttpErrorResponse && action.payload.error.status == 402) {
        const title = this.i18n({id: 'serviceLimits.trial', value: 'Free Service'});
        const message = this.i18n({
          id: 'collection.create.serviceLimits',
          value: 'You are currently on the Free plan which allows you to have only limited number of files. Do you want to upgrade to Business now?'
        });
        return new NotificationsAction.Confirm({
          title,
          message,
          action: new RouterAction.Go({
            path: ['/organization', organization.code, 'detail'],
            extras: {fragment: 'orderService'}
          })
        });
      }
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
        map((dto: Collection) => CollectionConverter.fromDto(dto)),
        map(collection => new CollectionsAction.UpdateSuccess({collection: collection})),
        catchError((error) => Observable.of(new CollectionsAction.CreateFailure({error: error})))
      );
    })
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
    mergeMap(action => this.collectionService.removeCollection(action.payload.collectionId).pipe(
      flatMap(collectionId => [new CollectionsAction.DeleteSuccess({collectionId}),
        new DocumentsAction.ClearByCollection({collectionId})
      ]),
      catchError((error) => Observable.of(new CollectionsAction.DeleteFailure({error: error})))
    ))
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
      map(() => action.payload.collectionId),
      map((collectionId) => new CollectionsAction.AddFavoriteSuccess({collectionId})),
      catchError((error) => Observable.of(new CollectionsAction.AddFavoriteFailure({error: error})))
    )),
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
      map(() => action.payload.collectionId),
      map((collectionId) => new CollectionsAction.RemoveFavoriteSuccess({collectionId})),
      catchError((error) => Observable.of(new CollectionsAction.RemoveFavoriteFailure({error: error})))
    )),
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
        map(result => ({action, attribute: CollectionConverter.fromAttributeDto(result)})),
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
    })
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
      map(() => action),
      map(action => new CollectionsAction.RemoveAttributeSuccess(action.payload)),
      catchError((error) => Observable.of(new CollectionsAction.RemoveAttributeFailure({error: error})))
    ))
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
  public changePermission$ = this.actions$.pipe(
    ofType<CollectionsAction.ChangePermission>(CollectionsActionType.CHANGE_PERMISSION),
    concatMap(action => {
      const permissionDto: Permission = PermissionsConverter.toPermissionDto(action.payload.permission);

      let observable;
      if (action.payload.type === PermissionType.Users) {
        observable = this.collectionService.updateUserPermission(permissionDto);
      } else {
        observable = this.collectionService.updateGroupPermission(permissionDto);
      }
      return observable.pipe(
        concatMap(() => Observable.of()),
        catchError((error) => {
          const payload = {collectionId: action.payload.collectionId, type: action.payload.type, permission: action.payload.currentPermission, error};
          return Observable.of(new CollectionsAction.ChangePermissionFailure(payload))
        })
      )
    })
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

  constructor(private actions$: Actions,
              private store$: Store<AppState>,
              private collectionService: CollectionService,
              private homePageService: HomePageService,
              private i18n: I18n,
              private importService: ImportService,
              private searchService: SearchService) {
  }

}
