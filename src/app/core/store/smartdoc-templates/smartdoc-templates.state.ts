/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';

import {SmartDocTemplateModel} from './smartdoc-template.model';

export interface SmartDocTemplatesState extends EntityState<SmartDocTemplateModel> {

  selectedTemplatePart: {
    templateId: string;
    documentId: string;
    partIndex: number;
  };

}

export const smartDocTemplatesAdapter = createEntityAdapter<SmartDocTemplateModel>({selectId: template => template.id});

export const initialSmartDocTemplatesState: SmartDocTemplatesState = smartDocTemplatesAdapter.getInitialState({
  selectedTemplatePart: null
});

export const selectSmartDocTemplatesState = (state: AppState) => state.smartDocTemplates;
export const selectSmartDocTemplateEntities = smartDocTemplatesAdapter.getSelectors().selectEntities;

export const selectSmartDocTemplatesDictionary = createSelector(selectSmartDocTemplatesState, selectSmartDocTemplateEntities);
export const selectSelectedSmartDocTemplatePart = createSelector(selectSmartDocTemplatesState, templateState => templateState.selectedTemplatePart);
