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
import {PivotsAction, PivotsActionType} from './pivots.action';
import {PivotsState, initialPivotsState, pivotsAdapter} from './pivots.state';

export function pivotsReducer(state: PivotsState = initialPivotsState, action: PivotsAction.All): PivotsState {
  switch (action.type) {
    case PivotsActionType.ADD_PIVOT:
      return pivotsAdapter.upsertOne(action.payload.pivot, state);
    case PivotsActionType.REMOVE_PIVOT:
      return pivotsAdapter.removeOne(action.payload.pivotId, state);
    case PivotsActionType.SET_CONFIG:
      return pivotsAdapter.updateOne({id: action.payload.pivotId, changes: {config: action.payload.config}}, state);
    case PivotsActionType.CLEAR:
      return initialPivotsState;
    default:
      return state;
  }
}
