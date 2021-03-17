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
import {ConstraintData} from '@lumeer/data-filters';
import {AppState} from '../app.state';
import {selectAllUsers, selectCurrentUser} from '../users/users.state';

export type ConstraintDataState = Partial<ConstraintData>;

export const initialConstraintDataState: ConstraintDataState = {};

export const selectConstraintDataState = (state: AppState) => state.constraintData;

export const selectConstraintData = createSelector(
  selectConstraintDataState,
  selectAllUsers,
  selectCurrentUser,
  (state, users, currentUser) => ({
    ...state,
    users,
    currentUser,
  })
);
