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
import {EMPTY, Observable, of} from 'rxjs';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Action, select, Store} from '@ngrx/store';
import {delay, map, mergeMap, withLatestFrom} from 'rxjs/operators';
import {WorkflowsAction, WorkflowsActionType} from './workflows.action';
import {NavigationAction} from '../navigation/navigation.action';
import {AppState} from '../app.state';
import {selectWorkflowSelectedDocumentId} from './workflow.state';
import {selectDocumentsDictionary} from '../documents/documents.state';
import {workflowCellToViewCursor} from '../../../view/perspectives/workflow/content/tables/service/workflow-utils';
import {selectViewCursor} from '../navigation/navigation.state';
import {deepObjectsEquals} from '../../../shared/utils/common.utils';

@Injectable()
export class WorkflowsEffects {
  public setOpenedDocument$ = createEffect(() =>
    this.actions$.pipe(
      ofType<WorkflowsAction.SetOpenedDocument>(WorkflowsActionType.SET_OPENED_DOCUMENT),
      map(
        action =>
          new NavigationAction.SetViewCursor({
            cursor: {
              documentId: action.payload.documentId,
              linkInstanceId: action.payload.cell?.linkId,
              linkTypeId: action.payload.column?.linkTypeId,
              collectionId: action.payload.column?.collectionId,
              attributeId: action.payload.column?.attribute?.id,
              value: action.payload.column?.tableId || action.payload.cell?.tableId,
              sidebar: true,
            },
          })
      )
    )
  );

  public setSelectedCell$ = createEffect(() =>
    this.actions$.pipe(
      ofType<WorkflowsAction.SetSelectedCell>(WorkflowsActionType.SET_SELECTED_CELL),
      withLatestFrom(this.store$.pipe(select(selectViewCursor))),
      mergeMap(([action, viewCursor]) => {
        const {cell, column} = action.payload;
        const cursor = workflowCellToViewCursor(cell, column);
        cursor && (cursor.sidebar = viewCursor?.sidebar);
        if (cursor && !deepObjectsEquals(cursor, viewCursor)) {
          return of(new NavigationAction.SetViewCursor({cursor}));
        }

        return EMPTY;
      })
    )
  );

  public resetOpenedDocument$ = createEffect(() =>
    this.actions$.pipe(
      ofType<WorkflowsAction.ResetOpenedDocument>(WorkflowsActionType.RESET_OPENED_DOCUMENT),
      delay(100),
      withLatestFrom(this.store$.pipe(select(selectWorkflowSelectedDocumentId))),
      withLatestFrom(this.store$.pipe(select(selectDocumentsDictionary))),
      mergeMap(([[, selectedDocumentId], documentsMap]) => {
        const document = documentsMap[selectedDocumentId];
        if (document) {
          return of(new NavigationAction.SetViewCursor({cursor: {}}));
        }

        return EMPTY;
      })
    )
  );

  constructor(private actions$: Actions, private store$: Store<AppState>) {}
}
