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

import {createReducer, on} from '@ngrx/store';
import * as ResourceVariableActions from './resource-variables.actions';
import {initialResourceVariablesState, resourceVariablesAdapter} from './resource-variables.state';

export const resourceVariablesReducer = createReducer(
  initialResourceVariablesState,
  on(ResourceVariableActions.getSuccess, (state, action) =>
    resourceVariablesAdapter.upsertMany(action.variables, {
      ...state,
      loadedProjects: [...state.loadedProjects, action.workspace.projectId],
    })
  ),
  on(ResourceVariableActions.getOneSuccess, (state, action) =>
    resourceVariablesAdapter.upsertOne(action.variable, state)
  ),
  on(ResourceVariableActions.updateSuccess, (state, action) =>
    resourceVariablesAdapter.upsertOne(action.variable, state)
  ),
  on(ResourceVariableActions.updateFailure, (state, action) =>
    resourceVariablesAdapter.upsertOne(action.variable, state)
  ),
  on(ResourceVariableActions.createSuccess, (state, action) =>
    resourceVariablesAdapter.upsertOne(action.variable, state)
  ),
  on(ResourceVariableActions.deleteSuccess, (state, action) => resourceVariablesAdapter.removeOne(action.id, state)),
  on(ResourceVariableActions.deleteFailure, (state, action) =>
    resourceVariablesAdapter.upsertOne(action.variable, state)
  ),
  on(ResourceVariableActions.clearResourceVariables, () => initialResourceVariablesState)
);
