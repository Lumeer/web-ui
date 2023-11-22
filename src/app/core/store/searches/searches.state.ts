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
import {EntityState, createEntityAdapter} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';

import {DEFAULT_PERSPECTIVE_ID} from '../../../view/perspectives/perspective';
import {AppState} from '../app.state';
import {selectWorkspace} from '../navigation/navigation.state';
import {Search} from './search';

export interface SearchesState extends EntityState<Search> {}

export const searchesAdapter = createEntityAdapter<Search>({selectId: search => search.id});

export const initialSearchesState: SearchesState = searchesAdapter.getInitialState();

export const selectSearchesState = (state: AppState) => state.searches;
export const selectSearchesDictionary = createSelector(
  selectSearchesState,
  searchesAdapter.getSelectors().selectEntities
);
export const selectSearchById = id => createSelector(selectSearchesDictionary, searches => searches[id]);

export const selectSearchId = createSelector(
  selectWorkspace,
  workspace => workspace?.viewCode || DEFAULT_PERSPECTIVE_ID
);

export const selectSearch = createSelector(
  selectSearchesDictionary,
  selectSearchId,
  (searchesMap, searchId) => searchesMap[searchId]
);

export const selectSearchConfig = createSelector(selectSearch, search => search?.config);

export const selectSearchConfigById = (id: string) =>
  createSelector(selectSearchesDictionary, searches => searches[id]?.config);
