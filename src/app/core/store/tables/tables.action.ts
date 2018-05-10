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

import {Action} from '@ngrx/store';
import {Direction} from '../../../shared/direction';
import {QueryModel} from '../navigation/query.model';
import {TableBodyCursor, TableCursor, TableHeaderCursor} from './table-cursor';
import {TableColumn, TableConfig, TableModel, TablePart, TableRow} from './table.model';
import {EditedAttribute} from './tables.state';

export enum TablesActionType {

  CREATE_TABLE = '[Tables] Create Table',
  ADD_TABLE = '[Tables] Add Table',
  DESTROY_TABLE = '[Tables] Destroy Table',
  REMOVE_TABLE = '[Tables] Remove Table',

  CREATE_PART = '[Tables] Create Part',
  ADD_PART = '[Tables] Add Part',
  SWITCH_PARTS = '[Tables] Switch Parts',
  REMOVE_PART = '[Tables] Remove Part',

  ADD_COLUMN = '[Tables] Add Column',
  SPLIT_COLUMN = '[Tables] Split Column',
  REPLACE_COLUMNS = '[Tables] Replace Column',
  SHOW_COLUMNS = '[Tables] Show Columns',
  HIDE_COLUMN = '[Tables] Hide Column',
  MOVE_COLUMN = '[Tables] Move Column',
  RESIZE_COLUMN = '[Tables] Resize Column',
  REMOVE_COLUMN = '[Tables] Remove Column',
  INIT_COLUMN = '[Tables] Initialize Column',

  GROUP_BY_COLUMN = '[Tables] Group By Column',
  SORT_BY_COLUMN = '[Tables] Sort By Column',

  LOAD_ROWS = '[Tables] Load Rows',
  DISPOSE_ROWS = '[Tables] Dispose Rows',

  ADD_ROWS = '[Tables] Add Rows',
  ADD_LINKED_ROWS = '[Tables] Add Linked Rows',
  REPLACE_ROWS = '[Tables] Replace Rows',
  MOVE_ROW = '[Tables] Move Row',
  UNLINK_ROW = '[Tables] Unlink Row',
  REMOVE_ROW = '[Tables] Remove Row',
  SELECT_ROW = '[Tables] Select Row',

  EXPAND_ROWS = '[Tables] Expand Rows',
  COLLAPSE_ROWS = '[Tables] Collapse Rows',

  EDIT_CELL = '[Tables] Edit Cell',
  COPY_CELL = '[Tables] Copy Cell',
  PASTE_CELL = '[Tables] Paste Cell',
  MOVE_CELL = '[Tables] Move Cell',

  SET_CURSOR = '[Tables] Set Cursor',
  MOVE_CURSOR = '[Tables] Move Cursor',

  SET_EDITED_ATTRIBUTE = '[Tables] Set Edited Document',

  ADD_FUNCTION = '[Tables] Add Function',
  REMOVE_FUNCTION = '[Tables] Remove Function',
}

export namespace TablesAction {

  export interface TableCursorAction extends Action {
    payload: {
      cursor: TableCursor
    }
  }

  export class CreateTable implements Action {
    public readonly type = TablesActionType.CREATE_TABLE;

    public constructor(public payload: { tableId: string, query: QueryModel }) {
    }
  }

  export class AddTable implements Action {
    public readonly type = TablesActionType.ADD_TABLE;

    public constructor(public payload: { table: TableModel }) {
    }
  }

  export class DestroyTable implements Action {
    public readonly type = TablesActionType.DESTROY_TABLE;

    public constructor(public payload: { tableId: string }) {
    }
  }

  export class RemoveTable implements Action {
    public readonly type = TablesActionType.REMOVE_TABLE;

    public constructor(public payload: { tableId: string }) {
    }
  }

  export class CreatePart implements Action {
    public readonly type = TablesActionType.CREATE_PART;

    public constructor(public payload: { tableId: string, linkTypeId: string, config?: TableConfig }) {
    }
  }

  export class AddPart implements Action {
    public readonly type = TablesActionType.ADD_PART;

    public constructor(public payload: { tableId: string, parts: TablePart[] }) {
    }
  }

  export class SwitchParts implements TableCursorAction {
    public readonly type = TablesActionType.SWITCH_PARTS;

    public constructor(public payload: { cursor: TableHeaderCursor }) {
    }
  }

  export class RemovePart implements TableCursorAction {
    public readonly type = TablesActionType.REMOVE_PART;

    public constructor(public payload: { cursor: TableHeaderCursor }) {
    }
  }

  export class AddColumn implements TableCursorAction {
    public readonly type = TablesActionType.ADD_COLUMN;

    public constructor(public payload: { cursor: TableHeaderCursor, column: TableColumn }) {
    }
  }

  export class SplitColumn implements TableCursorAction {
    public readonly type = TablesActionType.SPLIT_COLUMN;

    public constructor(public payload: { cursor: TableHeaderCursor }) {
    }
  }

  export class ReplaceColumns implements Action {
    public readonly type = TablesActionType.REPLACE_COLUMNS;

    public constructor(public payload: { cursor: TableHeaderCursor, deleteCount: number, columns?: TableColumn[] }) {
    }
  }

  export class ShowColumns implements TableCursorAction {
    public readonly type = TablesActionType.SHOW_COLUMNS;

    public constructor(public payload: { cursor: TableHeaderCursor, attributeIds: string[] }) {
    }
  }

  export class HideColumn implements TableCursorAction {
    public readonly type = TablesActionType.HIDE_COLUMN;

    public constructor(public payload: { cursor: TableHeaderCursor }) {
    }
  }

  export class RemoveColumn implements TableCursorAction {
    public readonly type = TablesActionType.REMOVE_COLUMN;

    public constructor(public payload: { cursor: TableHeaderCursor }) {
    }
  }

  export class MoveColumn implements TableCursorAction {
    public readonly type = TablesActionType.MOVE_COLUMN;

    public constructor(public payload: { cursor: TableHeaderCursor, toIndex: number }) {
    }
  }

  export class ResizeColumn implements Action {
    public readonly type = TablesActionType.RESIZE_COLUMN;

    public constructor(public payload: { cursor: TableHeaderCursor, delta: number }) {
    }
  }

  export class InitColumn implements Action {
    public readonly type = TablesActionType.INIT_COLUMN;

    public constructor(public payload: { cursor: TableHeaderCursor, attributeId: string }) {
    }
  }

  export class ReplaceRows implements Action {
    public readonly type = TablesActionType.REPLACE_ROWS;

    public constructor(public payload: { cursor: TableBodyCursor, rows: TableRow[], deleteCount: number }) {
    }
  }

  export class AddRows implements Action {
    public readonly type = TablesActionType.ADD_ROWS;

    public constructor(public payload: { cursor: TableBodyCursor, rows: TableRow[] }) {
    }
  }

  export class AddLinkedRows implements Action {
    public readonly type = TablesActionType.ADD_LINKED_ROWS;

    public constructor(public payload: { cursor: TableBodyCursor, linkedRows: TableRow[] }) {
    }
  }

  export class RemoveRow implements Action {
    public readonly type = TablesActionType.REMOVE_ROW;

    public constructor(public payload: { cursor: TableBodyCursor }) {
    }
  }

  export class CollapseRows implements Action {
    public readonly type = TablesActionType.COLLAPSE_ROWS;

    public constructor(public payload: { cursor: TableBodyCursor }) {
    }
  }

  export class ExpandRows implements Action {
    public readonly type = TablesActionType.EXPAND_ROWS;

    public constructor(public payload: { cursor: TableBodyCursor }) {
    }
  }

  export class SetCursor implements TableCursorAction {
    public readonly type = TablesActionType.SET_CURSOR;

    public constructor(public payload: { cursor: TableCursor }) {
    }
  }

  export class MoveCursor implements Action {
    public readonly type = TablesActionType.MOVE_CURSOR;

    public constructor(public payload: { cursor: TableCursor, direction: Direction }) {
    }
  }

  export class SetEditedAttribute implements Action {
    public readonly type = TablesActionType.SET_EDITED_ATTRIBUTE;

    public constructor(public payload: { editedAttribute: EditedAttribute }) {
    }
  }

  export type All = CreateTable | AddTable | DestroyTable | RemoveTable |
    CreatePart | AddPart | SwitchParts | RemovePart |
    AddColumn | SplitColumn | ReplaceColumns | RemoveColumn |
    HideColumn | ShowColumns |
    MoveColumn | ResizeColumn | InitColumn |
    ReplaceRows | AddRows | AddLinkedRows | RemoveRow |
    CollapseRows | ExpandRows |
    SetCursor | MoveCursor |
    SetEditedAttribute;
}
