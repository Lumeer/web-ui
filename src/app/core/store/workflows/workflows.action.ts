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

import {Action} from '@ngrx/store';
import {Workflow, WorkflowConfig} from './workflow';
import {QueryStem} from '../navigation/query/query';
import {TableCell} from '../../../shared/table/model/table-model';
import {TableColumn} from '../../../shared/table/model/table-column';

export enum WorkflowsActionType {
  ADD_KANBAN = '[Workflow] Add workflow',
  REMOVE_KANBAN = '[Workflow] Remove workflow',

  SET_CONFIG = '[Workflow] Set config',
  SET_COLUMN_WIDTH = '[Workflow] Set column width',
  SET_TABLE_HEIGHT = '[Workflow] Set table height',
  SET_OPENED_DOCUMENT = '[Workflow] Set opened document',
  RESET_OPENED_DOCUMENT = '[Workflow] Reset opened document',
  SET_SELECTED_CELL = '[Workflow] Set selected cell',

  CLEAR = '[Workflow] Clear',
}

export namespace WorkflowsAction {
  export class AddWorkflow implements Action {
    public readonly type = WorkflowsActionType.ADD_KANBAN;

    public constructor(public payload: {workflow: Workflow}) {}
  }

  export class RemoveWorkflow implements Action {
    public readonly type = WorkflowsActionType.REMOVE_KANBAN;

    public constructor(public payload: {workflowId: string}) {}
  }

  export class SetConfig implements Action {
    public readonly type = WorkflowsActionType.SET_CONFIG;

    public constructor(public payload: {workflowId: string; config: WorkflowConfig}) {}
  }

  export class SetColumnWidth implements Action {
    public readonly type = WorkflowsActionType.SET_COLUMN_WIDTH;

    public constructor(
      public payload: {
        workflowId: string;
        width: number;
        attributeId: string;
        collectionId: string;
        linkTypeId?: string;
      }
    ) {}
  }

  export class SetTableHeight implements Action {
    public readonly type = WorkflowsActionType.SET_TABLE_HEIGHT;

    public constructor(
      public payload: {workflowId: string; height: number; collectionId: string; stem: QueryStem; value?: any}
    ) {}
  }

  export class SetOpenedDocument implements Action {
    public readonly type = WorkflowsActionType.SET_OPENED_DOCUMENT;

    public constructor(public payload: {documentId: string; cell?: TableCell; column?: TableColumn}) {}
  }

  export class SetSelectedCell implements Action {
    public readonly type = WorkflowsActionType.SET_SELECTED_CELL;

    public constructor(public payload: {cell?: TableCell; column?: TableColumn}) {}
  }

  export class ResetOpenedDocument implements Action {
    public readonly type = WorkflowsActionType.RESET_OPENED_DOCUMENT;
  }

  export class Clear implements Action {
    public readonly type = WorkflowsActionType.CLEAR;
  }

  export type All =
    | AddWorkflow
    | RemoveWorkflow
    | SetConfig
    | SetTableHeight
    | SetColumnWidth
    | SetOpenedDocument
    | ResetOpenedDocument
    | Clear;
}
