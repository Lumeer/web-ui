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
import {Action, Store} from '@ngrx/store';
import {Observable} from 'rxjs/Observable';
import {catchError, map, skipWhile, switchMap, tap, withLatestFrom, flatMap} from 'rxjs/operators';
import {Document} from '../../dto';
import {DocumentService, SearchService} from '../../rest';
import {AppState} from '../app.state';
import {QueryConverter} from '../navigation/query.converter';
import {QueryHelper} from '../navigation/query.helper';
import {NotificationsAction} from '../notifications/notifications.action';
import {DocumentConverter} from './document.converter';
import {DocumentModel} from './document.model';
import {DocumentsAction, DocumentsActionType} from './documents.action';
import {selectDocumentsQueries} from './documents.state';
import {selectCollectionsDictionary} from "../collections/collections.state";
import {CollectionsAction} from "../collections/collections.action";
import {CollectionModel} from "../collections/collection.model";

@Injectable()
export class DocumentsEffects {

  @Effect()
  public get$: Observable<Action> = this.actions$.ofType<DocumentsAction.Get>(DocumentsActionType.GET).pipe(
    withLatestFrom(this.store$.select(selectDocumentsQueries)),
    skipWhile(([action, queries]) => queries.some(query => QueryHelper.equal(query, action.payload.query))),
    switchMap(([action]) => {
      const queryDto = QueryConverter.toDto(action.payload.query);

      return this.searchService.searchDocuments(queryDto).pipe(
        map(dtos => dtos.map(dto => DocumentConverter.fromDto(dto)))
      );
    }),
    map(documents => new DocumentsAction.GetSuccess({documents: documents})),
    catchError((error) => Observable.of(new DocumentsAction.GetFailure({error: error})))
  );

  @Effect()
  public getFailure$: Observable<Action> = this.actions$.ofType<DocumentsAction.GetFailure>(DocumentsActionType.GET_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to get records'}))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.ofType<DocumentsAction.Create>(DocumentsActionType.CREATE).pipe(
    switchMap(action => {
      const documentDto = DocumentConverter.toDto(action.payload.document);

      return this.documentService.createDocument(documentDto).pipe(
        map(dto => DocumentConverter.fromDto(dto, action.payload.document.correlationId))
      );
    }),
    withLatestFrom(this.store$.select(selectCollectionsDictionary)),
    flatMap(([document, collectionEntities]) => {
      const collection = collectionEntities[document.collectionId];
      return [new DocumentsAction.CreateSuccess({document}),
        this.createAddCollectionAttributesAction(collection, document)];
    }),
    catchError((error) => Observable.of(new DocumentsAction.CreateFailure({error: error})))
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.ofType<DocumentsAction.CreateFailure>(DocumentsActionType.CREATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to create record'}))
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.ofType<DocumentsAction.Update>(DocumentsActionType.UPDATE).pipe(
    switchMap(action => {
      const documentDto = DocumentConverter.toDto(action.payload.document);

      if (action.payload.toggleFavourite) {
        return this.documentService.toggleDocumentFavorite(documentDto).pipe(
          map(() => {
            action.payload.document.favorite = !action.payload.document.favorite;
            return action.payload.document;
          })
        );
      }

      throw Error('not implemented on backend yet');
    }),
    map((document: DocumentModel) => new DocumentsAction.UpdateSuccess({document: document})),
    catchError((error) => Observable.of(new DocumentsAction.UpdateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.ofType<DocumentsAction.UpdateFailure>(DocumentsActionType.UPDATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to update record'}))
  );

  @Effect()
  public updateData$: Observable<Action> = this.actions$.ofType<DocumentsAction.UpdateData>(DocumentsActionType.UPDATE_DATA).pipe(
    switchMap(action => {
      const documentDto: Document = {
        id: action.payload.documentId,
        collectionId: action.payload.collectionId,
        data: action.payload.data
      };
      return this.documentService.updateDocument(documentDto).pipe(
        map(dto => DocumentConverter.fromDto(dto))
      );
    }),
    withLatestFrom(this.store$),
    flatMap(([document, state]) => {
      const collection = state.collections.entities[document.collectionId];
      const oldDocument = state.documents.entities[document.id];

      return [new DocumentsAction.UpdateDataSuccess({document}),
        this.createUpdateCollectionAttributesAction(collection, document, oldDocument)];
    }),
    catchError((error) => Observable.of(new DocumentsAction.UpdateDataFailure({error: error})))
  );

  @Effect()
  public updateDataFailure$: Observable<Action> = this.actions$.ofType<DocumentsAction.UpdateDataFailure>(DocumentsActionType.UPDATE_DATA_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to update data'}))
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.ofType<DocumentsAction.Delete>(DocumentsActionType.DELETE).pipe(
    switchMap(action => {
      const document = action.payload.document;

      return this.documentService.removeDocument(document.collectionId, document.id).pipe(
        map(() => document)
      )
    }),
    withLatestFrom(this.store$.select(selectCollectionsDictionary)),
    flatMap(([document, collectionEntities]) => {
      const collection = collectionEntities[document.collectionId];
      return [new DocumentsAction.DeleteSuccess({documentId: document.id}),
        this.createRemoveCollectionsAttributesAction(collection, document)];
    }),
    catchError((error) => Observable.of(new DocumentsAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteConfirm$: Observable<Action> = this.actions$.ofType<DocumentsAction.DeleteConfirm>(DocumentsActionType.DELETE_CONFIRM).pipe(
    map((action: DocumentsAction.DeleteConfirm) => new NotificationsAction.Confirm({
      title: 'Remove document',
      message: 'Do you really want to remove this document?',
      action: new DocumentsAction.Delete(action.payload)
    }))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.ofType<DocumentsAction.DeleteFailure>(DocumentsActionType.DELETE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to delete record'}))
  );

  constructor(private actions$: Actions,
              private documentService: DocumentService,
              private searchService: SearchService,
              private store$: Store<AppState>) {
  }

  private createAddCollectionAttributesAction(collection: CollectionModel, document: DocumentModel): Action {
    const collectionCopy = {...collection, documentsCount: collection.documentsCount + 1};

    const addedAttributes = Object.keys(document.data);

    this.incrementOrAddAttributesInCollection(collectionCopy, addedAttributes);

    return new CollectionsAction.UpdateSuccess({collection: collectionCopy});
  }

  private createUpdateCollectionAttributesAction(collection: CollectionModel, document: DocumentModel, oldDocument: DocumentModel): Action {
    const collectionCopy = {...collection};

    const oldAttributes = Object.keys(oldDocument.data);
    const newAttributes = Object.keys(document.data);

    const addedAttributes = newAttributes.filter(attr => !oldAttributes.includes(attr));
    const removedAttributes = oldAttributes.filter(attr => !newAttributes.includes(attr));

    this.incrementOrAddAttributesInCollection(collectionCopy, addedAttributes);
    this.decrementAttributesInCollection(collectionCopy, removedAttributes);

    return new CollectionsAction.UpdateSuccess({collection: collectionCopy});
  }

  private createRemoveCollectionsAttributesAction(collection: CollectionModel, document: DocumentModel): Action {
    const collectionCopy = {...collection, documentsCount: Math.max(collection.documentsCount - 1, 0)};

    const deletedAttributes = Object.keys(document.data);
    this.decrementAttributesInCollection(collectionCopy, deletedAttributes);

    return new CollectionsAction.UpdateSuccess({collection: collectionCopy});
  }

  private decrementAttributesInCollection(collection: CollectionModel, attributeIds: string[]) {
    collection.attributes = collection.attributes.map(attribute => {
        if (attributeIds.includes(attribute.id)) {
          attribute.usageCount = Math.max(attribute.usageCount - 1, 0);
        }
        return attribute;
      }
    );
  }

  private incrementOrAddAttributesInCollection(collection: CollectionModel, attributeIds: string[]) {
    collection.attributes = collection.attributes.map(attribute => {
        const attributeIndex = attributeIds.indexOf(attribute.id);
        if (attributeIndex !== -1) {
          attribute.usageCount = attribute.usageCount + 1;
          attributeIds.splice(attributeIndex, 1);
        }
        return attribute;
      }
    );

    const newAttributes = attributeIds.map(attributeId => ({id: attributeId, name: attributeId, constraints: [], usageCount: 1}));
    collection.attributes.push(...newAttributes);
  }

}
