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

import {initialSequencesState, sequencesAdapter, SequencesState} from './sequences.state';
import {SequencesAction, SequencesActionType} from './sequences.action';

export function sequencesReducer(
  state: SequencesState = initialSequencesState,
  action: SequencesAction.All
): SequencesState {
  switch (action.type) {
    case SequencesActionType.GET_SUCCESS:
      return {
        ...sequencesAdapter.upsertMany(action.payload.sequences, state),
        loaded: true,
      };
    case SequencesActionType.UPDATE_SUCCESS:
      return sequencesAdapter.upsertOne(action.payload.sequence, state);
    case SequencesActionType.DELETE_SUCCESS:
      return sequencesAdapter.removeOne(action.payload.id, state);
    default:
      return state;
  }
}
