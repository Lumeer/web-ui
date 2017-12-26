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

import {SmartDocTemplatesAction, SmartDocTemplatesActionType} from './smartdoc-templates.action';
import {initialSmartDocTemplatesState, smartDocTemplatesAdapter, SmartDocTemplatesState} from './smartdoc-templates.state';

export function smartDocTemplatesReducer(state: SmartDocTemplatesState = initialSmartDocTemplatesState,
                                         action: SmartDocTemplatesAction.All): SmartDocTemplatesState {
  switch (action.type) {
    case SmartDocTemplatesActionType.GET_SUCCESS:
      return smartDocTemplatesAdapter.addAll(action.payload.templates, state);
    case SmartDocTemplatesActionType.CREATE_SUCCESS:
      return smartDocTemplatesAdapter.addOne(action.payload.template, state);
    case SmartDocTemplatesActionType.UPDATE_SUCCESS:
      return smartDocTemplatesAdapter.updateOne({id: action.payload.template.id, changes: action.payload.template}, state);
    case SmartDocTemplatesActionType.DELETE_SUCCESS:
      return smartDocTemplatesAdapter.removeOne(action.payload.templateId, state);
    case SmartDocTemplatesActionType.SELECT:
      return {...state, selectedTemplatePart: action.payload};
    case SmartDocTemplatesActionType.DESELECT:
      return {...state, selectedTemplatePart: null};
    default:
      return state;
  }
}
