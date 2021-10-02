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

import {Detail, DetailConfig} from './detail';
import {QueryStem} from '../navigation/query/query';
import {AttributesSettings} from '../views/view';

export const add = createAction('[Detail] Add', props<{detail: Detail}>());

export const remove = createAction('[Detail] Remove', props<{detailId: string}>());

export const setConfig = createAction(
  '[Detail] Set Config',
  props<{detailId: string; config: Partial<DetailConfig>}>()
);

export const addCollapsedLink = createAction(
  '[Detail] Add Collapsed Link',
  props<{detailId: string; linkTypeId: string}>()
);

export const removeCollapsedLink = createAction(
  '[Detail] Remove Collapsed Link',
  props<{detailId: string; linkTypeId: string}>()
);

export const addCollapsedCollection = createAction(
  '[Detail] Add Collapsed Collection',
  props<{detailId: string; collectionId: string}>()
);

export const removeCollapsedCollection = createAction(
  '[Detail] Remove Collapsed Collection',
  props<{detailId: string; collectionId: string}>()
);

export const setStemAttributes = createAction(
  '[Detail] Set Stem Attributes',
  props<{detailId: string; stem: QueryStem; attributes: AttributesSettings}>()
);

export const clear = createAction('[Detail] Clear');
