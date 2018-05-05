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
import {catchError, flatMap, map, mergeMap, skipWhile, tap, withLatestFrom} from 'rxjs/operators';
import {extractAttributeName} from '../../../shared/utils/attribute.utils';
import {Document} from '../../dto';
import {DocumentService, SearchService} from '../../rest';
import {AppState} from '../app.state';
import {AttributeModel, CollectionModel} from '../collections/collection.model';
import {CollectionsAction} from '../collections/collections.action';
import {selectCollectionsDictionary} from '../collections/collections.state';
import {QueryConverter} from '../navigation/query.converter';
import {QueryHelper} from '../navigation/query.helper';
import {NotificationsAction} from '../notifications/notifications.action';
import {DocumentConverter} from './document.converter';
import {DocumentModel} from './document.model';
import {DocumentsAction, DocumentsActionType} from './documents.action';
import {selectDocumentsDictionary, selectDocumentsQueries} from './documents.state';
import {HttpErrorResponse} from "@angular/common/http";
import {selectOrganizationByWorkspace} from "../organizations/organizations.state";
import {RouterAction} from "../router/router.action";

@Injectable()
export class DocumentsEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Get>(DocumentsActionType.GET),
    withLatestFrom(this.store$.select(selectDocumentsQueries)),
    skipWhile(([action, queries]) => queries.some(query => QueryHelper.equal(query, action.payload.query))),
    mergeMap(([action]) => {
      const queryDto = QueryConverter.toDto(action.payload.query);

      return this.searchService.searchDocuments(queryDto).pipe(
        map(dtos => dtos.map(dto => DocumentConverter.fromDto(dto))),
        map(documents => new DocumentsAction.GetSuccess({documents: documents})),
        catchError((error) => Observable.of(new DocumentsAction.GetFailure({error: error})))
      );
    })
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.GetFailure>(DocumentsActionType.GET_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'documents.get.fail', value: 'Failed to get records'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Create>(DocumentsActionType.CREATE),
    mergeMap(action => {
      const documentDto = DocumentConverter.toDto(action.payload.document);

      return this.documentService.createDocument(documentDto).pipe(
        map(dto => ({action, document: DocumentConverter.fromDto(dto, action.payload.document.correlationId)})),
        withLatestFrom(this.store$.select(selectCollectionsDictionary)),
        tap(([{action, document}]) => {
          const callback = action.payload.callback;
          if (callback) {
            callback(document.id);
          }
        }),
        flatMap(([{document}, collectionEntities]) => {
          const collection = collectionEntities[document.collectionId];
          return [
            new DocumentsAction.CreateSuccess({document}),
            createSyncCollectionAction(collection, document, null)
          ];
        }),
        // flatMap(([{action, document}, collectionEntities]) => {
        //   const collection = collectionEntities[document.collectionId];
        //   const actions: Action[] = [
        //     new DocumentsAction.CreateSuccess({document}),
        //     createSyncCollectionAction(collection, document, null)
        //   ];
        //
        //   const nextAction = action.payload.nextAction;
        //   if (nextAction && nextAction.type === LinkInstancesActionType.CREATE) {
        //     (nextAction as LinkInstancesAction.Create).payload.linkInstance.documentIds[1] = document.id;
        //     actions.push(nextAction);
        //   }
        //
        //   return actions;
        // }),
        catchError((error) => Observable.of(new DocumentsAction.CreateFailure({error: error})))
      );
    })
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.CreateFailure>(DocumentsActionType.CREATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    withLatestFrom(this.store$.select(selectOrganizationByWorkspace)),
    map(([action, organization]) => {
      if (action.payload.error instanceof HttpErrorResponse && action.payload.error.status == 402) {
        const title = this.i18n({ id: 'serviceLimits.trial', value: 'Free Service' });
        const message = this.i18n({
          id: 'document.create.serviceLimits',
          value: 'You are currently on the Free plan which allows you to have only limited number of records. Do you want to upgrade to Business now?' });
        return new NotificationsAction.Confirm({
          title,
          message,
          action: new RouterAction.Go({
            path: ['/organization', organization.code, 'detail'],
            extras: { fragment: 'orderService' }
          })
        });
      }
      const message = this.i18n({id: 'document.create.fail', value: 'Failed to create record'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Update>(DocumentsActionType.UPDATE),
    mergeMap(action => {
      const documentDto = DocumentConverter.toDto(action.payload.document);

      if (action.payload.toggleFavourite) {
        return this.documentService.toggleDocumentFavorite(documentDto).pipe(
          map(() => {
            action.payload.document.favorite = !action.payload.document.favorite;
            return action.payload.document;
          }),
          map((document: DocumentModel) => new DocumentsAction.UpdateSuccess({document: document})),
          catchError((error) => Observable.of(new DocumentsAction.UpdateFailure({error: error})))
        );
      }

      throw Error('not implemented on backend yet');
    })
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.UpdateFailure>(DocumentsActionType.UPDATE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'document.update.fail', value: 'Failed to update record'});
      return new NotificationsAction.Error({message});
    })
  );

  @Effect()
  public updateData$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.UpdateData>(DocumentsActionType.UPDATE_DATA),
    mergeMap(action => {
      const documentDto: Document = {
        id: action.payload.documentId,
        collectionId: action.payload.collectionId,
        data: action.payload.data
      };
      return this.documentService.updateDocument(documentDto).pipe(
        map(dto => DocumentConverter.fromDto(dto)),
        withLatestFrom(this.store$.select(selectCollectionsDictionary)),
        withLatestFrom(this.store$.select(selectDocumentsDictionary)),
        flatMap(([[document, collectionEntities], documentEntities]) => {
          const collection = collectionEntities[document.collectionId];
          const oldDocument = documentEntities[document.id];

          return [
            new DocumentsAction.UpdateSuccess({document}),
            createSyncCollectionAction(collection, document, oldDocument)
          ];
        }),
        catchError((error) => Observable.of(new DocumentsAction.UpdateFailure({error: error})))
      );
    }),
  );

  @Effect()
  public patchData$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.PatchData>(DocumentsActionType.PATCH_DATA),
    mergeMap(action => {
      const documentDto: Document = {
        id: action.payload.documentId,
        collectionId: action.payload.collectionId,
        data: action.payload.data
      };
      return this.documentService.patchDocumentData(documentDto).pipe(
        map(dto => DocumentConverter.fromDto(dto)),
        withLatestFrom(this.store$.select(selectCollectionsDictionary)),
        withLatestFrom(this.store$.select(selectDocumentsDictionary)),
        flatMap(([[document, collectionEntities], documentEntities]) => {
          const collection = collectionEntities[document.collectionId];
          const oldDocument = documentEntities[document.id];

          return [
            new DocumentsAction.UpdateSuccess({document}),
            createSyncCollectionAction(collection, document, oldDocument)
          ];
        }),
        catchError((error) => Observable.of(new DocumentsAction.UpdateFailure({error: error})))
      );
    }),
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.Delete>(DocumentsActionType.DELETE),
    mergeMap(action => {
      return this.documentService.removeDocument(action.payload.collectionId, action.payload.documentId).pipe(
        map(() => action.payload),
        withLatestFrom(this.store$.select(selectCollectionsDictionary)),
        withLatestFrom(this.store$.select(selectDocumentsDictionary)),
        flatMap(([[payload, collectionEntities], documentEntities]) => {
          const collection = collectionEntities[payload.collectionId];
          const oldDocument = documentEntities[payload.documentId];

          const actions: Action[] = [
            new DocumentsAction.DeleteSuccess({documentId: oldDocument.id}),
            createSyncCollectionAction(collection, null, oldDocument)
          ];

          if (payload.nextAction) {
            actions.push(payload.nextAction);
          }

          return actions;
        }),
        catchError((error) => Observable.of(new DocumentsAction.DeleteFailure({error: error})))
      );
    }),
  );

  @Effect()
  public deleteConfirm$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.DeleteConfirm>(DocumentsActionType.DELETE_CONFIRM),
    map((action: DocumentsAction.DeleteConfirm) => {
      const title = this.i18n({id: 'document.delete.dialog.title', value: 'Delete record'});
      const message = this.i18n({id: 'document.delete.dialog.message', value: 'Do you really want to delete this record?'});

      return new NotificationsAction.Confirm({
        title,
        message,
        action: new DocumentsAction.Delete(action.payload)
      });
    })
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.DeleteFailure>(DocumentsActionType.DELETE_FAILURE),
    tap(action => console.error(action.payload.error)),
    map(() => {
      const message = this.i18n({id: 'document.delete.fail', value: 'Failed to delete record'});
      return new NotificationsAction.Error({message});
    })
  );

  constructor(private actions$: Actions,
              private documentService: DocumentService,
              private i18n: I18n,
              private searchService: SearchService,
              private store$: Store<AppState>) {
  }

}

function createSyncCollectionAction(collection: CollectionModel,
                                    newDocument: DocumentModel,
                                    oldDocument: DocumentModel): CollectionsAction.UpdateSuccess {
  const newAttributeIds: string[] = newDocument && newDocument.data ? Object.keys(newDocument.data) : [];
  const oldAttributeIds: string[] = oldDocument && oldDocument.data ? Object.keys(oldDocument.data) : [];

  const attributes = updateAttributes(collection.attributes, newAttributeIds, oldAttributeIds);
  const documentsCount = collection.documentsCount + (!oldDocument ? 1 : 0) - (!newDocument ? 1 : 0);
  const updatedCollection: CollectionModel = {...collection, attributes, documentsCount};

  return new CollectionsAction.UpdateSuccess({collection: updatedCollection});
}

function updateAttributes(attributes: AttributeModel[],
                          newDocumentAttributeIds: string[],
                          oldDocumentAttributeIds: string[]): AttributeModel[] {
  const addedAttributeIds = newDocumentAttributeIds.filter(id => !oldDocumentAttributeIds.includes(id));
  const removedAttributeIds = oldDocumentAttributeIds.filter(id => !newDocumentAttributeIds.includes(id));

  const attributeIds = attributes.map(attribute => attribute.id);
  const createdAttributes = addedAttributeIds.filter(id => !attributeIds.includes(id))
    .map(id => ({id, name: extractAttributeName(id), constraints: [], usageCount: 1}));

  return attributes.map(attribute => {
    if (addedAttributeIds.includes(attribute.id)) {
      return {...attribute, usageCount: attribute.usageCount + 1};
    }
    if (removedAttributeIds.includes(attribute.id)) {
      return {...attribute, usageCount: Math.max(attribute.usageCount - 1, 0)};
    }
    return attribute;
  }).concat(createdAttributes);
}
