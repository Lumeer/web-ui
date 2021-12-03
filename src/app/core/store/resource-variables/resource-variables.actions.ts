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

import {createAction, props} from '@ngrx/store';

import {ResourceVariable} from './resource-variable';
import {Workspace} from '../navigation/workspace';

export const get = createAction('[ResourceVariables] Get', props<{workspace: Workspace}>());

export const getSuccess = createAction(
  '[ResourceVariables] Get :: Success',
  props<{variables: ResourceVariable[]; workspace: Workspace}>()
);

export const getFailure = createAction('[ResourceVariables] Get :: Failure', props<{error: any}>());

export const create = createAction('[ResourceVariables] Create', props<{variable: ResourceVariable}>());

export const createSuccess = createAction(
  '[ResourceVariables] Create :: Success',
  props<{variable: ResourceVariable}>()
);

export const createFailure = createAction('[ResourceVariables] Create :: Failure', props<{error: any}>());

export const update = createAction('[ResourceVariables] Update', props<{variable: ResourceVariable}>());

export const updateSuccess = createAction(
  '[ResourceVariables] Update :: Success',
  props<{variable: ResourceVariable}>()
);

export const updateFailure = createAction(
  '[ResourceVariables] Update :: Failure',
  props<{error: any; variable: ResourceVariable}>()
);

export const deleteConfirm = createAction('[ResourceVariables] Delete Confirm', props<{id: string}>());

export const deleteVariable = createAction('[ResourceVariables] Delete', props<{id: string}>());

export const deleteSuccess = createAction('[ResourceVariables] Delete :: Success', props<{id: string}>());

export const deleteFailure = createAction(
  '[ResourceVariables] Delete :: Failure',
  props<{error: any; variable: ResourceVariable}>()
);

export const clearResourceVariables = createAction('[ResourceVariables] Clear');
