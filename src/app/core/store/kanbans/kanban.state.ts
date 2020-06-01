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
import {DEFAULT_KANBAN_ID, Kanban} from './kanban';
import {selectWorkspace} from '../navigation/navigation.state';

export interface KanbansState extends EntityState<Kanban> {}

export const kanbansAdapter = createEntityAdapter<Kanban>({selectId: kanban => kanban.id});

export const initialKanbansState: KanbansState = kanbansAdapter.getInitialState();

export const selectKanbansState = (state: AppState) => state.kanbans;
export const selectKanbansDictionary = createSelector(selectKanbansState, kanbansAdapter.getSelectors().selectEntities);
export const selectKanbanById = id => createSelector(selectKanbansDictionary, kanbans => kanbans[id]);

export const selectKanbanId = createSelector(selectWorkspace, workspace => workspace?.viewCode || DEFAULT_KANBAN_ID);

export const selectKanban = createSelector(selectKanbansDictionary, selectKanbanId, (map, id) => map[id]);
export const selectKanbanConfig = createSelector(selectKanban, kanban => kanban?.config);
