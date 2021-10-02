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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {AppState} from '../app.state';
import {createSelector} from '@ngrx/store';
import {SelectionList} from '../../../shared/lists/selection/selection-list';

export interface SelectionListsState extends EntityState<SelectionList> {
  loadedForOrganizationId: string;
}

export const selectionListsAdapter = createEntityAdapter<SelectionList>({
  selectId: list => list.id,
});

export const initialSelectionListsState: SelectionListsState = selectionListsAdapter.getInitialState({
  loadedForOrganizationId: null,
  loadedForProjects: [],
});

export const selectSelectionListsState = (state: AppState) => state.selectionLists;

export const selectAllSelectionLists = createSelector(selectSelectionListsState, selectionListsAdapter.getSelectors().selectAll);

export const selectSelectionListsLoadedOrganization = createSelector(
  selectSelectionListsState,
  state => state.loadedForOrganizationId
);

export const selectAllSelectionListsSorted = createSelector(selectAllSelectionLists, sequences =>
  sequences.sort((a, b) => a.name.localeCompare(b.name))
);

export const selectSelectionListsLoaded = (organizationId: string) =>
  createSelector(selectSelectionListsState, state => state.loadedForOrganizationId === organizationId);
