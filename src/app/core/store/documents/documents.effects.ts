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
import {catchError, map, skipWhile, switchMap, tap, withLatestFrom} from 'rxjs/operators';
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
    map(() => new NotificationsAction.Error({message: 'Failed to get documents'}))
  );

  @Effect()
  public create$: Observable<Action> = this.actions$.ofType<DocumentsAction.Create>(DocumentsActionType.CREATE).pipe(
    switchMap(action => {
      const documentDto = DocumentConverter.toDto(action.payload.document);

      return this.documentService.createDocument(documentDto).pipe(
        map(dto => DocumentConverter.fromDto(dto, action.payload.document.correlationId))
      );
    }),
    map(document => new DocumentsAction.CreateSuccess({document: document})),
    catchError((error) => Observable.of(new DocumentsAction.CreateFailure({error: error})))
  );

  @Effect()
  public createFailure$: Observable<Action> = this.actions$.ofType<DocumentsAction.CreateFailure>(DocumentsActionType.CREATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to create document'}))
  );

  @Effect()
  public update$: Observable<Action> = this.actions$.ofType<DocumentsAction.Update>(DocumentsActionType.UPDATE).pipe(
    switchMap(action => {
      const documentDto = DocumentConverter.toDto(action.payload.document);

      throw Error('not implemented on backend yet');
    }),
    map((document: DocumentModel) => new DocumentsAction.UpdateSuccess({document: document})),
    catchError((error) => Observable.of(new DocumentsAction.UpdateFailure({error: error})))
  );

  @Effect()
  public updateFailure$: Observable<Action> = this.actions$.ofType<DocumentsAction.UpdateFailure>(DocumentsActionType.UPDATE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to update document'}))
  );

  @Effect()
  public updateData$: Observable<Action> = this.actions$.ofType<DocumentsAction.UpdateData>(DocumentsActionType.UPDATE_DATA).pipe(
    switchMap(action => {
      const documentDto: Document = {
        id: action.payload.documentId,
        collectionCode: action.payload.collectionCode,
        data: action.payload.data
      };

      return this.documentService.patchDocumentData(documentDto).pipe(
        map(dto => DocumentConverter.fromDto(dto))
      );
    }),
    map(document => new DocumentsAction.UpdateDataSuccess({document: document})),
    catchError((error) => Observable.of(new DocumentsAction.UpdateDataFailure({error: error})))
  );

  @Effect()
  public updateDataFailure$: Observable<Action> = this.actions$.ofType<DocumentsAction.UpdateDataFailure>(DocumentsActionType.UPDATE_DATA_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to update data'}))
  );

  @Effect()
  public delete$: Observable<Action> = this.actions$.ofType<DocumentsAction.Delete>(DocumentsActionType.DELETE).pipe(
    switchMap(action => this.documentService.removeDocument(action.payload.collectionCode, action.payload.documentId).pipe(
      map(() => action)
    )),
    map(action => new DocumentsAction.DeleteSuccess({documentId: action.payload.documentId})),
    catchError((error) => Observable.of(new DocumentsAction.DeleteFailure({error: error})))
  );

  @Effect()
  public deleteFailure$: Observable<Action> = this.actions$.ofType<DocumentsAction.DeleteFailure>(DocumentsActionType.DELETE_FAILURE).pipe(
    tap(action => console.error(action.payload.error)),
    map(() => new NotificationsAction.Error({message: 'Failed to delete document'}))
  );

  constructor(private actions$: Actions,
              private documentService: DocumentService,
              private searchService: SearchService,
              private store$: Store<AppState>) {
  }

}
