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

import {HttpErrorResponse} from '@angular/common/http';
import {Injectable} from '@angular/core';

import {Actions, Effect, ofType} from '@ngrx/effects';
import {Action, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable} from 'rxjs/Observable';
import {catchError, concatMap, filter, flatMap, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {Collection, Permission} from '../../dto';
import {CollectionService, ImportService, SearchService} from '../../rest';
import {AppState} from '../app.state';
import {CommonAction} from '../common/common.action';
import {DocumentModel} from '../documents/document.model';
import {DocumentsAction, DocumentsActionType} from '../documents/documents.action';
import {QueryConverter} from '../navigation/query.converter';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectOrganizationByWorkspace} from '../organizations/organizations.state';
import {PermissionsConverter} from '../permissions/permissions.converter';
import {PermissionType} from '../permissions/permissions.model';
import {RouterAction} from '../router/router.action';
import {TablesAction, TablesActionType} from '../tables/tables.action';
import {CollectionConverter} from './collection.converter';
import {AttributeModel} from './collection.model';
import {CollectionsAction, CollectionsActionType} from './collections.action';
import {selectCollectionsLoaded} from './collections.state';

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
        map(collection => ({collection, action})),
        mergeMap(({collection, action}) => {
          const actions: Action[] = [new CollectionsAction.CreateSuccess({collection})];

          const {callback} = action.payload;
          if (callback) {
            actions.push(new CommonAction.ExecuteCallback({callback: () => callback(collection)}));
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
  public addFavorite$ = this.actions$.pipe(
    ofType<CollectionsAction.AddFavorite>(CollectionsActionType.ADD_FAVORITE),
    mergeMap(action => this.collectionService.addFavorite(action.payload.collectionId).pipe(
      mergeMap(() => Observable.of()),
      catchError((error) => Observable.of(new CollectionsAction.AddFavoriteFailure({collectionId: action.payload.collectionId, error: error})))
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
  public removeFavorite$ = this.actions$.pipe(
    ofType<CollectionsAction.RemoveFavorite>(CollectionsActionType.REMOVE_FAVORITE),
    mergeMap(action => this.collectionService.removeFavorite(action.payload.collectionId).pipe(
      mergeMap(() => Observable.of()),
      catchError((error) => Observable.of(new CollectionsAction.RemoveFavoriteFailure({collectionId: action.payload.collectionId, error: error})))
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
  public createAttributes$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.CreateAttributes>(CollectionsActionType.CREATE_ATTRIBUTES),
    mergeMap(action => {
      const attributesDto = action.payload.attributes.map(attr => CollectionConverter.toAttributeDto(attr));
      const correlationIdMap = action.payload.attributes.reduce((acc, attr) => {
        acc[attr.name] = attr.correlationId;
        return acc;
      }, {});

      return this.collectionService.createAttributes(action.payload.collectionId, attributesDto).pipe(
        map(attributes => ({action, attributes: attributes.map(attr => CollectionConverter.fromAttributeDto(attr, correlationIdMap[attr.name]))})),
        flatMap(({action, attributes}) => {
          const {callback, nextAction} = action.payload;
          if (callback) {
            callback(attributes);
          }

          const actions: Action[] = [new CollectionsAction.CreateAttributesSuccess(
            {collectionId: action.payload.collectionId, attributes}
          )];
          if (nextAction) {
            if (nextAction.type === DocumentsActionType.CREATE) {
              const action = nextAction as DocumentsAction.Create;
              action.payload.document = convertNewAttributes(attributes, action);
            } else if (nextAction.type === DocumentsActionType.UPDATE_DATA) {
              const action = nextAction as DocumentsAction.UpdateData;
              action.payload.document = convertNewAttributes(attributes, action);
            } else if (nextAction.type === DocumentsActionType.PATCH_DATA) {
              const action = nextAction as DocumentsAction.PatchData;
              action.payload.document = convertNewAttributes(attributes, action);
            } else if (nextAction.type === TablesActionType.INIT_COLUMN) {
              (nextAction as TablesAction.InitColumn).payload.attributeId = attributes[0].id;
            }
            actions.push(nextAction);
          }
          return actions;
        }),
        catchError((error) => Observable.of(new CollectionsAction.CreateAttributesFailure({error: error})))
      );
    })
  );

  @Effect()
  public createAttributesFailure$: Observable<Action> = this.actions$.pipe(
    ofType<CollectionsAction.CreateAttributesFailure>(CollectionsActionType.CREATE_ATTRIBUTES_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'collection.create.attributes.fail', value: 'Failed to create attributes'});
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
          return Observable.of(new CollectionsAction.ChangePermissionFailure(payload));
        })
      );
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
              private i18n: I18n,
              private importService: ImportService,
              private searchService: SearchService) {
  }

}


function convertNewAttributes(attributes: AttributeModel[], action: DocumentsAction.Create | DocumentsAction.UpdateData | DocumentsAction.PatchData): DocumentModel {
  const document = action.payload.document;
  const newAttributes = Object.keys(document.newData).reduce((acc, attrName) => {
    const attribute = attributes.find(attr => attr.name === attrName);
    if (attribute) {
      acc[attribute.id] = document.newData[attrName].value;
    }
    return acc;
  }, {});

  const newData = {...document.data, ...newAttributes};
  return {...document, data: newData};
}
