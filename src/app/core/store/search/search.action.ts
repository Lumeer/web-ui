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

export enum SearchActionType {

  GET_SELECTED_DOCUMENTS = '[Search Documents] Get selected',
  ADD_SELECTED_DOCUMENT = '[Search Documents] Add selected',
  REMOVE_SELECTED_DOCUMENT = '[Search Documents] Remove selected',
  CLEAR_SELECTED_DOCUMENTS = '[Search Documents] Clear selected',

}

export namespace SearchAction {

  export class GetSelectedDocuments implements Action {
    public readonly type = SearchActionType.GET_SELECTED_DOCUMENTS;

    public constructor() {
    }
  }

  export class AddSelectedDocument implements Action {
    public readonly type = SearchActionType.ADD_SELECTED_DOCUMENT;

    public constructor(public payload: { id: string }) {
    }
  }

  export class RemoveSelectedDocument implements Action {
    public readonly type = SearchActionType.REMOVE_SELECTED_DOCUMENT;

    public constructor(public payload: { id: string }) {
    }
  }

  export class ClearSelectedDocuments implements Action {
    public readonly type = SearchActionType.CLEAR_SELECTED_DOCUMENTS;

    public constructor() {
    }
  }

  export type All = GetSelectedDocuments | AddSelectedDocument | RemoveSelectedDocument | ClearSelectedDocuments;
}
