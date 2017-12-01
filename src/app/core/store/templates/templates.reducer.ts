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

import {TemplatesAction, TemplatesActionType} from './templates.action';
import {initialTemplatesState, templatesAdapter, TemplatesState} from './templates.state';

export function templatesReducer(state: TemplatesState = initialTemplatesState, action: TemplatesAction.All): TemplatesState {
  switch (action.type) {
    case TemplatesActionType.GET_SUCCESS:
      return templatesAdapter.addAll(action.payload.templates, state);
    case TemplatesActionType.CREATE_SUCCESS:
      return templatesAdapter.addOne(action.payload.template, state);
    case TemplatesActionType.UPDATE_SUCCESS:
      return templatesAdapter.updateOne({id: action.payload.template.id, changes: action.payload.template}, state);
    case TemplatesActionType.DELETE_SUCCESS:
      return templatesAdapter.removeOne(action.payload.templateId, state);
    case TemplatesActionType.SELECT:
      return {...state, selectedTemplateId: action.payload.templateId};
    case TemplatesActionType.DESELECT:
      return {...state, selectedTemplateId: null};
    default:
      return state;
  }
}
