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

import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {DEFAULT_SEARCH_ID, Search} from './search';
import {selectWorkspace} from '../navigation/navigation.state';

export interface SearchesState extends EntityState<Search> {}

export const searchesAdapter = createEntityAdapter<Search>({selectId: search => search.id});

export const initialSearchesState: SearchesState = searchesAdapter.getInitialState();

export const selectSearchesState = (state: AppState) => state.searches;
export const selectSearchesDictionary = createSelector(
  selectSearchesState,
  searchesAdapter.getSelectors().selectEntities
);
export const selectSearchById = id =>
  createSelector(
    selectSearchesDictionary,
    searches => searches[id]
  );

export const selectSearchId = createSelector(
  selectWorkspace,
  workspace => (workspace && workspace.viewCode) || DEFAULT_SEARCH_ID
);

export const selectSearch = createSelector(
  selectSearchesDictionary,
  selectSearchId,
  (searchesMap, searchId) => searchesMap[searchId] && searchesMap[searchId]
);

export const selectSearchConfig = createSelector(
  selectSearch,
  search => search && search.config
);
