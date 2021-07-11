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

import {TeamsAction, TeamsActionType} from './teams.action';
import {teamsAdapter, TeamsState, initialTeamsState} from './teams.state';

export function teamsReducer(state: TeamsState = initialTeamsState, action: TeamsAction.All): TeamsState {
  switch (action.type) {
    case TeamsActionType.GET_SUCCESS:
      const newState = {...state, loaded: {...state.loaded, [action.payload.organizationId]: true}};
      return teamsAdapter.upsertMany(action.payload.teams, newState);
    case TeamsActionType.CREATE_SUCCESS:
      return teamsAdapter.addOne(action.payload.team, state);
    case TeamsActionType.UPDATE_SUCCESS:
      return teamsAdapter.upsertOne(action.payload.team, state);
    case TeamsActionType.DELETE_SUCCESS:
      return teamsAdapter.removeOne(action.payload.teamId, state);
    case TeamsActionType.CLEAR:
      return initialTeamsState;
    default:
      return state;
  }
}
