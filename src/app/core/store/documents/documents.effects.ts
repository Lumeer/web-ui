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
import {Document} from '../../dto';
import {CollectionService, DocumentService, SearchService} from '../../rest';
import {AppState} from '../app.state';
import {AttributeModel, CollectionModel} from '../collections/collection.model';
import {CollectionsAction} from '../collections/collections.action';
import {selectCollectionById, selectCollectionsDictionary} from '../collections/collections.state';
import {QueryConverter} from '../navigation/query.converter';
import {QueryHelper} from '../navigation/query.helper';
import {NotificationsAction} from '../notifications/notifications.action';
import {DocumentConverter} from './document.converter';
import {DocumentModel} from './document.model';
import {DocumentsAction, DocumentsActionType} from './documents.action';
import {selectDocumentById, selectDocumentsQueries} from './documents.state';
import {HttpErrorResponse} from "@angular/common/http";
import {selectOrganizationByWorkspace} from "../organizations/organizations.state";
import {RouterAction} from "../router/router.action";
import {CollectionConverter} from '../collections/collection.converter';

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
    withLatestFrom(this.store$.select(selectCollectionsDictionary)),
    mergeMap(([action, collectionEntities]) => {
      const documentDto = DocumentConverter.toDto(action.payload.document);
      const collection = collectionEntities[documentDto.collectionId];
      return saveNewAttributes(collection, documentDto, this.collectionService).pipe(
        map(({documentDto, attributes}) => ({action, documentDto, attributes}))
      )
    }),
    mergeMap(({action, documentDto, attributes}) => {
      return this.documentService.createDocument(documentDto).pipe(
        map(dto => ({action, document: DocumentConverter.fromDto(dto, action.payload.document.correlationId)})),
        withLatestFrom(this.store$.select(selectCollectionById(documentDto.collectionId))),
        tap(([{action, document}]) => {
          const callback = action.payload.callback;
          if (callback) {
            callback(document.id);
          }
        }),
        flatMap(([{document}, collection]) => {
          const collectionWithAttrs = {...collection, attributes: collection.attributes.concat(attributes)};
          return [
            new DocumentsAction.CreateSuccess({document}),
            createSyncCollectionAction(collectionWithAttrs, document, null)
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
        const title = this.i18n({id: 'serviceLimits.trial', value: 'Free Service'});
        const message = this.i18n({
          id: 'document.create.serviceLimits',
          value: 'You are currently on the Free plan which allows you to have only limited number of records. Do you want to upgrade to Business now?'
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
    withLatestFrom(this.store$.select(selectCollectionsDictionary)),
    mergeMap(([action, collectionEntities]) => {
      const collection = collectionEntities[action.payload.collectionId];
      const documentDto: Document = {id: action.payload.documentId, collectionId: action.payload.collectionId, data: action.payload.data};
      return saveNewAttributes(collection, documentDto, this.collectionService)
    }),
    mergeMap(({documentDto, attributes}) => {
      return this.documentService.updateDocument(documentDto).pipe(
        map(dto => DocumentConverter.fromDto(dto)),
        withLatestFrom(this.store$.select(selectCollectionById(documentDto.collectionId))),
        withLatestFrom(this.store$.select(selectDocumentById(documentDto.id))),
        flatMap(([[document, collection], oldDocument]) => {

          const collectionWithAttrs = {...collection, attributes: collection.attributes.concat(attributes)};
          return [
            new DocumentsAction.UpdateSuccess({document}),
            createSyncCollectionAction(collectionWithAttrs, document, oldDocument)
          ];
        }),
        catchError((error) => Observable.of(new DocumentsAction.UpdateFailure({error: error})))
      );
    }),
  );

  @Effect()
  public patchData$: Observable<Action> = this.actions$.pipe(
    ofType<DocumentsAction.PatchData>(DocumentsActionType.PATCH_DATA),
    withLatestFrom(this.store$.select(selectCollectionsDictionary)),
    mergeMap(([action, collectionEntities]) => {
      const collection = collectionEntities[action.payload.collectionId];
      const documentDto: Document = {id: action.payload.documentId, collectionId: action.payload.collectionId, data: action.payload.data};
      return saveNewAttributes(collection, documentDto, this.collectionService)
    }),
    mergeMap(({documentDto, attributes}) => {
      return this.documentService.patchDocumentData(documentDto).pipe(
        map(dto => DocumentConverter.fromDto(dto)),
        withLatestFrom(this.store$.select(selectCollectionById(documentDto.collectionId))),
        withLatestFrom(this.store$.select(selectDocumentById(documentDto.id))),
        flatMap(([[document, collection], oldDocument]) => {

          const collectionWithAttrs = {...collection, attributes: collection.attributes.concat(attributes)};
          return [
            new DocumentsAction.UpdateSuccess({document}),
            createSyncCollectionAction(collectionWithAttrs, document, oldDocument)
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
        withLatestFrom(this.store$.select(selectCollectionById(action.payload.collectionId))),
        withLatestFrom(this.store$.select(selectDocumentById(action.payload.documentId))),
        flatMap(([[payload, collection], oldDocument]) => {

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
              private collectionService: CollectionService,
              private i18n: I18n,
              private searchService: SearchService,
              private store$: Store<AppState>) {
  }

}


function saveNewAttributes(collection: CollectionModel,
                           documentDto: Document,
                           collectionService: CollectionService): Observable<{ documentDto: Document, attributes: AttributeModel[] }> {

  const newAttributes = findNewAttributes(collection, documentDto)
    .map(attr => CollectionConverter.toAttributeDto(attr));
  if (newAttributes.length === 0) {
    return Observable.of({documentDto, attributes: newAttributes});
  } else {
    return collectionService.createAttributes(documentDto.collectionId, newAttributes).pipe(
      map(attributes => ({documentDto, attributes}))
    )
  }
}

function findNewAttributes(collection: CollectionModel, newDocument: Document): AttributeModel[] {
  const newAttributeNames: string[] = newDocument && newDocument.data ? Object.keys(newDocument.data) : [];

  const attributeNames = collection.attributes.map(attribute => attribute.name);
  return newAttributeNames.filter(name => !attributeNames.includes(name))
    .map(name => ({name: name, constraints: []}));
}

function createSyncCollectionAction(collection: CollectionModel,
                                    newDocument: DocumentModel,
                                    oldDocument: DocumentModel): CollectionsAction.UpdateSuccess {
  const newAttributeNames: string[] = newDocument && newDocument.data ? Object.keys(newDocument.data) : [];
  const oldAttributeNames: string[] = oldDocument && oldDocument.data ? Object.keys(oldDocument.data) : [];

  const attributes = updateAttributes(collection.attributes, newAttributeNames, oldAttributeNames);
  const documentsCount = collection.documentsCount + (!oldDocument ? 1 : 0) - (!newDocument ? 1 : 0);
  const updatedCollection: CollectionModel = {...collection, attributes, documentsCount};

  return new CollectionsAction.UpdateSuccess({collection: updatedCollection});
}

function updateAttributes(attributes: AttributeModel[],
                          newDocumentAttributeNames: string[],
                          oldDocumentAttributeNames: string[]): AttributeModel[] {
  const addedAttributeNames = newDocumentAttributeNames.filter(name => !oldDocumentAttributeNames.includes(name));
  const removedAttributeNames = oldDocumentAttributeNames.filter(name => !newDocumentAttributeNames.includes(name));

  return attributes.map(attribute => {
    if (addedAttributeNames.includes(attribute.name)) {
      return {...attribute, usageCount: attribute.usageCount + 1};
    }
    if (removedAttributeNames.includes(attribute.name)) {
      return {...attribute, usageCount: Math.max(attribute.usageCount - 1, 0)};
    }
    return attribute;
  });
}
