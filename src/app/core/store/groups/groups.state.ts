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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {Group} from './group';
import {GroupFilters} from './group.filters';

export interface GroupsState extends EntityState<Group> {}

export const groupsAdapter = createEntityAdapter<Group>();

export const initialGroupsState: GroupsState = groupsAdapter.getInitialState();

export const selectGroupsState = (state: AppState) => state.groups;

const selectAllGroupsRaw = createSelector(
  selectGroupsState,
  groupsAdapter.getSelectors().selectAll
);
export const selectAllGroups = createSelector(
  selectAllGroupsRaw,
  groups => GroupFilters.filterFunctions(groups)
);

export const selectGroupsDictionary = createSelector(
  selectGroupsState,
  groupsAdapter.getSelectors().selectEntities
);
