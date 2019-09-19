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
import {Sequence} from '../../model/sequence';

export interface SequencesState extends EntityState<Sequence> {
  loaded: boolean;
}

export const sequencesAdapter = createEntityAdapter<Sequence>({
  selectId: sequence => sequence.id,
});

export const initialSequencesState: SequencesState = sequencesAdapter.getInitialState({
  loaded: false,
});

export const selectSequencesState = (state: AppState) => state.sequences;
export const selectAllSequences = createSelector(
  selectSequencesState,
  sequencesAdapter.getSelectors().selectAll
);

export const selectAllSequencesSorted = createSelector(
  selectAllSequences,
  sequences => sequences.sort((a, b) => a.name.localeCompare(b.name))
);

export const selectSequencesLoaded = createSelector(
  selectSequencesState,
  state => state.loaded
);
