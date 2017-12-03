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

import {Action} from '@ngrx/store';
import {TemplateModel, TemplatePartModel} from './template.model';

export enum TemplatesActionType {

  GET = '[Templates] Get',
  GET_SUCCESS = '[Templates] Get :: Success',
  GET_FAILURE = '[Templates] Get :: Failure',

  CREATE = '[Templates] Create',
  CREATE_SUCCESS = '[Templates] Create :: Success',
  CREATE_FAILURE = '[Templates] Create :: Failure',

  UPDATE = '[Templates] Update',
  UPDATE_SUCCESS = '[Templates] Update :: Success',
  UPDATE_FAILURE = '[Templates] Update :: Failure',

  DELETE = '[Templates] Delete',
  DELETE_SUCCESS = '[Templates] Delete :: Success',
  DELETE_FAILURE = '[Templates] Delete :: Failure',

  SELECT = '[Templates] Select',
  DESELECT = '[Templates] Deselect',

  ADD_PART = '[Templates] Add Part',
  UPDATE_PART = '[Templates] Update Part',
  REMOVE_PART = '[Templates] Remove Part'

}

export namespace TemplatesAction {

  export class Get implements Action {
    public readonly type = TemplatesActionType.GET;

    public constructor(public payload: { templateId: string }) {
    }
  }

  export class GetSuccess implements Action {
    public readonly type = TemplatesActionType.GET_SUCCESS;

    public constructor(public payload: { templates: TemplateModel[] }) {
    }
  }

  export class GetFailure implements Action {
    public readonly type = TemplatesActionType.GET_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Create implements Action {
    public readonly type = TemplatesActionType.CREATE;

    public constructor(public payload: { template: TemplateModel }) {
    }
  }

  export class CreateSuccess implements Action {
    public readonly type = TemplatesActionType.CREATE_SUCCESS;

    public constructor(public payload: { template: TemplateModel }) {
    }
  }

  export class CreateFailure implements Action {
    public readonly type = TemplatesActionType.CREATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Update implements Action {
    public readonly type = TemplatesActionType.UPDATE;

    public constructor(public payload: { template: TemplateModel }) {
    }
  }

  export class UpdateSuccess implements Action {
    public readonly type = TemplatesActionType.UPDATE_SUCCESS;

    public constructor(public payload: { template: TemplateModel }) {
    }
  }

  export class UpdateFailure implements Action {
    public readonly type = TemplatesActionType.UPDATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Delete implements Action {
    public readonly type = TemplatesActionType.DELETE;

    public constructor(public payload: { templateId: string }) {
    }
  }

  export class DeleteSuccess implements Action {
    public readonly type = TemplatesActionType.DELETE_SUCCESS;

    public constructor(public payload: { templateId: string }) {
    }
  }

  export class DeleteFailure implements Action {
    public readonly type = TemplatesActionType.DELETE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Select implements Action {
    public readonly type = TemplatesActionType.SELECT;

    public constructor(public payload: { templateId: string }) {
    }
  }

  export class Deselect implements Action {
    public readonly type = TemplatesActionType.DESELECT;
  }

  export class AddPart implements Action {
    public readonly type = TemplatesActionType.ADD_PART;

    public constructor(public payload: { templateId: string, part: TemplatePartModel }) {
    }
  }

  export class UpdatePart implements Action {
    public readonly type = TemplatesActionType.UPDATE_PART;

    public constructor(public payload: { templateId: string, partIndex: number, part: TemplatePartModel }) {
    }
  }

  export class RemovePart implements Action {
    public readonly type = TemplatesActionType.REMOVE_PART;

    public constructor(public payload: { templateId: string, partIndex: number }) {
    }
  }

  export type All =
    Get | GetSuccess | GetFailure |
    Create | CreateSuccess | CreateFailure |
    Update | UpdateSuccess | UpdateFailure |
    Delete | DeleteSuccess | DeleteFailure |
    Select | Deselect |
    AddPart | UpdatePart | RemovePart;
}
