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

import {initialSelectionListsState, selectionListsAdapter, SelectionListsState} from './selection-lists.state';
import {SelectionListsAction, SelectionListsActionType} from './selection-lists.action';

export function selectionListsReducer(
  state: SelectionListsState = initialSelectionListsState,
  action: SelectionListsAction.All
): SelectionListsState {
  switch (action.type) {
    case SelectionListsActionType.GET_SUCCESS:
      return {
        ...selectionListsAdapter.addMany(action.payload.lists, state),
        loadedForOrganizationId: action.payload.organizationId,
      };
    case SelectionListsActionType.GET_BY_PROJECT_SUCCESS:
      return selectionListsAdapter.upsertMany(action.payload.lists, state);
    case SelectionListsActionType.CREATE_SUCCESS:
    case SelectionListsActionType.UPDATE_SUCCESS:
    case SelectionListsActionType.DELETE_FAILURE:
      return selectionListsAdapter.upsertOne(action.payload.list, state);
    case SelectionListsActionType.DELETE_SUCCESS:
      return selectionListsAdapter.removeOne(action.payload.id, state);
    default:
      return state;
  }
}
