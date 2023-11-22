/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
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

import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store, select} from '@ngrx/store';

import {EMPTY, of} from 'rxjs';
import {delay, map, mergeMap, switchMap, take, withLatestFrom} from 'rxjs/operators';

import {deepObjectsEquals} from '@lumeer/utils';

import {workflowCellToViewCursor} from '../../../view/perspectives/workflow/content/tables/service/workflow-utils';
import {AppState} from '../app.state';
import {selectDocumentsDictionary} from '../documents/documents.state';
import {NavigationAction} from '../navigation/navigation.action';
import {selectViewCursor} from '../navigation/navigation.state';
import {selectWorkflowSelectedDocumentId} from './workflow.state';
import {WorkflowsAction, WorkflowsActionType} from './workflows.action';

@Injectable()
export class WorkflowsEffects {
  public setOpenedDocument$ = createEffect(() =>
    this.actions$.pipe(
      ofType<WorkflowsAction.SetOpenedDocument>(WorkflowsActionType.SET_OPENED_DOCUMENT),
      map(
        action =>
          new NavigationAction.SetViewCursor({
            cursor: {
              id: action.payload.workflowId,
              documentId: action.payload.documentId,
              linkInstanceId: action.payload.cell?.linkId,
              linkTypeId: action.payload.column?.linkTypeId,
              collectionId: action.payload.column?.collectionId || action.payload.collectionId,
              attributeId: action.payload.column?.attribute?.id || action.payload.attributeId,
              value: action.payload.column?.tableId || action.payload.cell?.tableId || action.payload.tableId,
              sidebar: true,
            },
            nextAction: action.payload.nextAction,
          })
      )
    )
  );

  public setSelectedCell$ = createEffect(() =>
    this.actions$.pipe(
      ofType<WorkflowsAction.SetSelectedCell>(WorkflowsActionType.SET_SELECTED_CELL),
      withLatestFrom(this.store$.pipe(select(selectViewCursor))),
      mergeMap(([action, viewCursor]) => {
        const {cell, column, workflowId} = action.payload;
        const cursor = workflowCellToViewCursor(workflowId, cell, column);
        cursor && (cursor.sidebar = viewCursor?.sidebar);
        if (cursor && !deepObjectsEquals(cursor, viewCursor)) {
          return of(new NavigationAction.SetViewCursor({cursor}));
        } else if (!cursor && !viewCursor?.sidebar) {
          return of(new NavigationAction.SetViewCursor({cursor: {}}));
        }
        return EMPTY;
      })
    )
  );

  public resetOpenedDocument$ = createEffect(() =>
    this.actions$.pipe(
      ofType<WorkflowsAction.ResetOpenedDocument>(WorkflowsActionType.RESET_OPENED_DOCUMENT),
      delay(100),
      switchMap(action =>
        this.store$.pipe(select(selectWorkflowSelectedDocumentId(action.payload.workflowId)), take(1))
      ),
      withLatestFrom(this.store$.pipe(select(selectDocumentsDictionary))),
      mergeMap(([selectedDocumentId, documentsMap]) => {
        const document = documentsMap[selectedDocumentId];
        if (document) {
          return of(new NavigationAction.SetViewCursor({cursor: {}}));
        }

        return EMPTY;
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store$: Store<AppState>
  ) {}
}
