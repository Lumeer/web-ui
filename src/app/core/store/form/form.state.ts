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
import {selectWorkspace} from '../navigation/navigation.state';
import {DEFAULT_PERSPECTIVE_ID} from '../../../view/perspectives/perspective';
import {FormModel} from './form-model';

export interface FormsState extends EntityState<FormModel> {}

export const formsAdapter = createEntityAdapter<FormModel>({selectId: model => model.id});

export const initialFormsState: FormsState = formsAdapter.getInitialState();

export const selectFormsState = (state: AppState) => state.forms;
export const selectFormsDictionary = createSelector(selectFormsState, formsAdapter.getSelectors().selectEntities);
export const selectFormById = id => createSelector(selectFormsDictionary, models => models[id]);

export const selectFormId = createSelector(selectWorkspace, workspace => workspace?.viewCode || DEFAULT_PERSPECTIVE_ID);

export const selectForm = createSelector(selectFormsDictionary, selectFormId, (map, id) => map[id]);
export const selectFormConfig = createSelector(selectForm, detail => detail?.config);
