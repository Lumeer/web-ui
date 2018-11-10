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
import {Action, select, Store} from '@ngrx/store';
import {I18n} from '@ngx-translate/i18n-polyfill';
import {Observable, of} from 'rxjs';
import {catchError, filter, first, flatMap, map, mergeMap, tap, withLatestFrom} from 'rxjs/operators';
import {CollectionService, DocumentService, SearchService} from '../../rest';
import {AppState} from '../app.state';
import {AttributeModel, CollectionModel} from '../collections/collection.model';
import {CollectionsAction} from '../collections/collections.action';
import {selectCollectionById} from '../collections/collections.state';
import {CommonAction} from '../common/common.action';
import {QueryConverter} from '../navigation/query.converter';
import {areQueriesEqual} from '../navigation/query.helper';
import {NotificationsAction} from '../notifications/notifications.action';
import {selectOrganizationByWorkspace} from '../organizations/organizations.state';
import {RouterAction} from '../router/router.action';
import {convertDocumentDtoToModel, convertDocumentModelToDto} from './document.converter';
import {DocumentModel} from './document.model';
import {DocumentsAction, DocumentsActionType} from './documents.action';
import {selectDocumentById, selectDocumentsQueries} from './documents.state';

@Injectable()
export class DocumentsEffects {
  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Get>(DocumentsActionType.GET),
    withLatestFrom(this.store$.select(selectDocumentsQueries)),
    filter(([action, queries]) => !queries.find(query => areQueriesEqual(query, action.payload.query))),
    mergeMap(([action]) => {
      const queryDto = QueryConverter.toDto(action.payload.query);

      return this.searchService.searchDocuments(queryDto).pipe(
        map(dtos => dtos.map(dto => convertDocumentDtoToModel(dto))),
        map(documents => new DocumentsAction.GetSuccess({documents: documents, query: action.payload.query})),
        catchError(error => of(new DocumentsAction.GetFailure({error: error})))
      );
    })
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.GetFailure>(DocumentsActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'documents.get.fail', value: 'Could not get records'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Create>(DocumentsActionType.CREATE),
    mergeMap(action => {
      const documentDto = convertDocumentModelToDto(action.payload.document);

      return this.documentService.createDocument(documentDto).pipe(
        map(dto => convertDocumentDtoToModel(dto, action.payload.document.correlationId)),
        withLatestFrom(this.store$.select(selectCollectionById(documentDto.collectionId))),
        tap(([document]) => {
          const callback = action.payload.callback;
          if (callback) {
            callback(document.id);
          }
        }),
        flatMap(([document, collection]) => {
          return [
            createSyncCollectionAction(collection, document, null),
            new DocumentsAction.CreateSuccess({document}),
          ];
        }),
        catchError(error => of(new DocumentsAction.CreateFailure({error: error})))
      );
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.CreateFailure>(DocumentsActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    withLatestFrom(this.store$.select(selectOrganizationByWorkspace)),
    map(([action, organization]) => {
      if (action.payload.error instanceof HttpErrorResponse && Number(action.payload.error.status) === 402) {
        const title = this.i18n({id: 'serviceLimits.trial', value: 'Free Service'});
        const message = this.i18n({
          id: 'document.create.serviceLimits',
          value:
            'You are currently on the Free plan which allows you to have only limited number of records. Do you want to upgrade to Business now?',
        });
        return new NotificationsAction.Confirm({
          title,
          message,
          action: new RouterAction.Go({
            path: ['/organization', organization.code, 'detail'],
            extras: {fragment: 'orderService'},
          }),
          yesFirst: true,
        });
      }
      const errorMessage = this.i18n({id: 'document.create.fail', value: 'Could not create the record'});
      return new NotificationsAction.Error({message: errorMessage});
    })
  );

  @Effect()
  public patch$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Patch>(DocumentsActionType.PATCH),
    mergeMap(action => {
      const documentDto = convertDocumentModelToDto(action.payload.document);
      return this.documentService
        .patchDocument(action.payload.collectionId, action.payload.documentId, documentDto)
        .pipe(
          map(dto => convertDocumentDtoToModel(dto)),
          withLatestFrom(
            this.store$.select(selectCollectionById(documentDto.collectionId)),
            this.store$.select(selectDocumentById(documentDto.id))
          ),
          flatMap(([document, collection, oldDocument]) => [
            createSyncCollectionAction(collection, document, oldDocument),
            new DocumentsAction.UpdateSuccess({document}),
          ]),
          catchError(error => of(new DocumentsAction.UpdateFailure({error: error})))
        );
    })
  );

  @Effect()
  public addFavorite$ = this.actions$.pipe(
    ofType<DocumentsAction.AddFavorite>(DocumentsActionType.ADD_FAVORITE),
    mergeMap(action =>
      this.documentService.addFavorite(action.payload.collectionId, action.payload.documentId).pipe(
        mergeMap(() => of()),
        catchError(error =>
          of(
            new DocumentsAction.AddFavoriteFailure({
              documentId: action.payload.documentId,
              error: error,
            })
          )
        )
      )
    )
  );

  @Effect()
  public addFavoriteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.AddFavoriteFailure>(DocumentsActionType.ADD_FAVORITE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'document.add.favorite.fail', value: 'Could not add the record to favorites'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public removeFavorite$ = this.actions$.pipe(
    ofType<DocumentsAction.RemoveFavorite>(DocumentsActionType.REMOVE_FAVORITE),
    mergeMap(action =>
      this.documentService.removeFavorite(action.payload.collectionId, action.payload.documentId).pipe(
        mergeMap(() => of()),
        catchError(error =>
          of(
            new DocumentsAction.RemoveFavoriteFailure({
              documentId: action.payload.documentId,
              error: error,
            })
          )
        )
      )
    )
  );

  @Effect()
  public removeFavoriteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.RemoveFavoriteFailure>(DocumentsActionType.REMOVE_FAVORITE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({
        id: 'document.remove.favorite.fail',
        value: 'Could not remove the record from favorites',
      });
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.UpdateFailure>(DocumentsActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'document.update.fail', value: 'Could not update the record'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public updateData$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.UpdateData>(DocumentsActionType.UPDATE_DATA),
    mergeMap(action => {
      const documentDto = convertDocumentModelToDto(action.payload.document);
      return this.documentService.updateDocumentData(documentDto).pipe(
        map(dto => convertDocumentDtoToModel(dto)),
        withLatestFrom(this.store$.select(selectCollectionById(documentDto.collectionId))),
        withLatestFrom(this.store$.select(selectDocumentById(documentDto.id))),
        flatMap(([[document, collection], oldDocument]) => {
          return [
            createSyncCollectionAction(collection, document, oldDocument),
            new DocumentsAction.UpdateSuccess({document}),
          ];
        }),
        catchError(error => of(new DocumentsAction.UpdateFailure({error: error})))
      );
    })
  );

  @Effect()
  public patchData$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.PatchData>(DocumentsActionType.PATCH_DATA),
    mergeMap(action => {
      const documentDto = convertDocumentModelToDto(action.payload.document);
      return this.documentService.patchDocumentData(documentDto).pipe(
        map(dto => convertDocumentDtoToModel(dto)),
        withLatestFrom(this.store$.select(selectCollectionById(documentDto.collectionId))),
        withLatestFrom(this.store$.select(selectDocumentById(documentDto.id))),
        flatMap(([[document, collection], oldDocument]) => {
          return [
            createSyncCollectionAction(collection, document, oldDocument),
            new DocumentsAction.UpdateSuccess({document}),
          ];
        }),
        catchError(error => of(new DocumentsAction.UpdateFailure({error: error})))
      );
    })
  );

  @Effect()
  public patchMetaData$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.PatchMetaData>(DocumentsActionType.PATCH_META_DATA),
    mergeMap(action => {
      const {collectionId, documentId, metaData} = action.payload;
      return this.store$.pipe(
        select(selectDocumentById(documentId)),
        first(),
        mergeMap(oldDocument => {
          return this.documentService.patchDocumentMetaData(collectionId, documentId, metaData).pipe(
            mergeMap(dto => {
              const document = {...convertDocumentDtoToModel(dto), data: oldDocument.data};
              const actions: Action[] = [new DocumentsAction.UpdateSuccess({document})];

              if (action.payload.onSuccess) {
                actions.push(new CommonAction.ExecuteCallback({callback: () => action.payload.onSuccess(document)}));
              }

              return actions;
            }),
            catchError(error => of(new DocumentsAction.UpdateFailure({error: error})))
          );
        })
      );
    })
  );

  @Effect()
  public updateMetaData$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.UpdateMetaData>(DocumentsActionType.UPDATE_META_DATA),
    mergeMap(action => {
      const documentDto = convertDocumentModelToDto(action.payload.document);
      return this.documentService.updateDocumentMetaData(documentDto).pipe(
        map(dto => new DocumentsAction.UpdateSuccess({document: convertDocumentDtoToModel(dto)})),
        catchError(error => of(new DocumentsAction.UpdateFailure({error: error})))
      );
    })
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Delete>(DocumentsActionType.DELETE),
    mergeMap(action => {
      return this.documentService.removeDocument(action.payload.collectionId, action.payload.documentId).pipe(
        map(() => action.payload),
        withLatestFrom(this.store$.select(selectCollectionById(action.payload.collectionId))),
        withLatestFrom(this.store$.select(selectDocumentById(action.payload.documentId))),
        flatMap(([[payload, collection], oldDocument]) => {
          const actions: Action[] = [
            new DocumentsAction.DeleteSuccess({documentId: oldDocument.id}),
            createSyncCollectionAction(collection, null, oldDocument),
          ];

          if (payload.nextAction) {
            actions.push(payload.nextAction);
          }

          return actions;
        }),
        catchError(error => of(new DocumentsAction.DeleteFailure({error: error})))
      );
    })
  );

  @Effect()
  public deleteConfirm$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.DeleteConfirm>(DocumentsActionType.DELETE_CONFIRM),
    map((action: DocumentsAction.DeleteConfirm) => {
      const title = this.i18n({id: 'document.delete.dialog.title', value: 'Delete record'});
      const message = this.i18n({
        id: 'document.delete.dialog.message',
        value: 'Do you really want to delete this record?',
      });

      return new NotificationsAction.Confirm({
        title,
        message,
        action: new DocumentsAction.Delete(action.payload),
      });
    })
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.DeleteFailure>(DocumentsActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'document.delete.fail', value: 'Could not delete the record'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(
    private actions$: Actions,
    private documentService: DocumentService,
    private collectionService: CollectionService,
    private i18n: I18n,
    private searchService: SearchService,
    private store$: Store<AppState>
  ) {}
}

function createSyncCollectionAction(
  collection: CollectionModel,
  newDocument: DocumentModel,
  oldDocument: DocumentModel
): CollectionsAction.UpdateSuccess {
  const newAttributeIds: string[] = newDocument && newDocument.data ? Object.keys(newDocument.data) : [];
  const oldAttributeIds: string[] = oldDocument && oldDocument.data ? Object.keys(oldDocument.data) : [];

  const attributes = updateAttributes(collection.attributes, newAttributeIds, oldAttributeIds);
  const documentsCount = collection.documentsCount + (!oldDocument ? 1 : 0) - (!newDocument ? 1 : 0);
  const updatedCollection: CollectionModel = {...collection, attributes, documentsCount};

  return new CollectionsAction.UpdateSuccess({collection: updatedCollection});
}

function updateAttributes(
  attributes: AttributeModel[],
  newDocumentAttributeIds: string[],
  oldDocumentAttributeIds: string[]
): AttributeModel[] {
  const addedAttributeIds = newDocumentAttributeIds.filter(name => !oldDocumentAttributeIds.includes(name));
  const removedAttributeIds = oldDocumentAttributeIds.filter(name => !newDocumentAttributeIds.includes(name));

  return attributes.map(attribute => {
    if (addedAttributeIds.includes(attribute.id)) {
      return {...attribute, usageCount: attribute.usageCount + 1};
    }
    if (removedAttributeIds.includes(attribute.id)) {
      return {...attribute, usageCount: Math.max(attribute.usageCount - 1, 0)};
    }
    return attribute;
  });
}
