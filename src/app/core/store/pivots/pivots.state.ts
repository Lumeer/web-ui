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
import {Pivot} from './pivot';

export interface PivotsState extends EntityState<Pivot> {}

export const pivotsAdapter = createEntityAdapter<Pivot>({selectId: pivot => pivot.id});

export const initialPivotsState: PivotsState = pivotsAdapter.getInitialState();

export const selectPivotsState = (state: AppState) => state.pivots;
export const selectPivotsDictionary = createSelector(selectPivotsState, pivotsAdapter.getSelectors().selectEntities);

export const selectPivotId = createSelector(
  selectWorkspace,
  workspace => workspace?.viewCode || DEFAULT_PERSPECTIVE_ID
);

export const selectPivot = createSelector(selectPivotsDictionary, selectPivotId, (map, id) => map[id]);

export const selectPivotConfig = createSelector(selectPivot, pivot => pivot && pivot.config);

export const selectPivotById = id => createSelector(selectPivotsDictionary, pivots => pivots[id]);
