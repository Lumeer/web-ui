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
import {SearchTab} from './search-tab';
import {QueryModel} from './query.model';

export enum NavigationActionType {
  ADD_LINK_TO_QUERY = '[Navigation] Add Link to Query',

  ADD_COLLECTION_TO_QUERY = '[Navigation] Add Collection to Query',
  REMOVE_COLLECTION_FROM_QUERY = '[Navigation] Remove Collection from Query',

  NAVIGATE_TO_PREVIOUS_URL = '[Navigation] Navigate To Previous URL',

  SET_QUERY = '[Navigation] Set query',

  REMOVE_VIEW_FROM_URL = '[Navigation] Remove view from URL',
}

export namespace NavigationAction {
  export class AddLinkToQuery implements Action {
    public readonly type = NavigationActionType.ADD_LINK_TO_QUERY;

    public constructor(public payload: {linkTypeId: string}) {}
  }

  export class AddCollectionToQuery implements Action {
    public readonly type = NavigationActionType.ADD_COLLECTION_TO_QUERY;

    public constructor(public payload: {collectionId: string}) {}
  }

  export class RemoveCollectionFromQuery implements Action {
    public readonly type = NavigationActionType.REMOVE_COLLECTION_FROM_QUERY;

    public constructor(public payload: {collectionId: string}) {}
  }

  export class SetQuery implements Action {
    public readonly type = NavigationActionType.SET_QUERY;

    public constructor(public payload: {query: QueryModel}) {}
  }

  export class RemoveViewFromUrl implements Action {
    public readonly type = NavigationActionType.REMOVE_VIEW_FROM_URL;

    public constructor(public payload: {setQuery?: QueryModel}) {}
  }

  export class NavigateToPreviousUrl implements Action {
    public readonly type = NavigationActionType.NAVIGATE_TO_PREVIOUS_URL;

    constructor(
      public payload: {
        previousUrl: string;
        organizationCode: string;
        projectCode: string;
        searchTab?: SearchTab;
      }
    ) {}
  }
}
