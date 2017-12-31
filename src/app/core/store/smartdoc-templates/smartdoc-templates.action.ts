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
import {SmartDocTemplateModel, SmartDocTemplatePartModel} from './smartdoc-template.model';

export enum SmartDocTemplatesActionType {

  GET = '[SmartDoc Templates] Get',
  GET_SUCCESS = '[SmartDoc Templates] Get :: Success',
  GET_FAILURE = '[SmartDoc Templates] Get :: Failure',

  CREATE = '[SmartDoc Templates] Create',
  CREATE_SUCCESS = '[SmartDoc Templates] Create :: Success',
  CREATE_FAILURE = '[SmartDoc Templates] Create :: Failure',

  UPDATE = '[SmartDoc Templates] Update',
  UPDATE_SUCCESS = '[SmartDoc Templates] Update :: Success',
  UPDATE_FAILURE = '[SmartDoc Templates] Update :: Failure',

  DELETE = '[SmartDoc Templates] Delete',
  DELETE_SUCCESS = '[SmartDoc Templates] Delete :: Success',
  DELETE_FAILURE = '[SmartDoc Templates] Delete :: Failure',

  SELECT = '[SmartDoc Templates] Select',
  DESELECT = '[SmartDoc Templates] Deselect',

  ADD_PART = '[SmartDoc Templates] Add Part',
  UPDATE_PART = '[SmartDoc Templates] Update Part',
  REMOVE_PART = '[SmartDoc Templates] Remove Part',
  MOVE_PART = '[SmartDoc Templates] Move Part'

}

export namespace SmartDocTemplatesAction {

  export class Get implements Action {
    public readonly type = SmartDocTemplatesActionType.GET;

    public constructor(public payload: { templateId: string }) {
    }
  }

  export class GetSuccess implements Action {
    public readonly type = SmartDocTemplatesActionType.GET_SUCCESS;

    public constructor(public payload: { templates: SmartDocTemplateModel[] }) {
    }
  }

  export class GetFailure implements Action {
    public readonly type = SmartDocTemplatesActionType.GET_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Create implements Action {
    public readonly type = SmartDocTemplatesActionType.CREATE;

    public constructor(public payload: { template: SmartDocTemplateModel }) {
    }
  }

  export class CreateSuccess implements Action {
    public readonly type = SmartDocTemplatesActionType.CREATE_SUCCESS;

    public constructor(public payload: { template: SmartDocTemplateModel }) {
    }
  }

  export class CreateFailure implements Action {
    public readonly type = SmartDocTemplatesActionType.CREATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Update implements Action {
    public readonly type = SmartDocTemplatesActionType.UPDATE;

    public constructor(public payload: { template: SmartDocTemplateModel }) {
    }
  }

  export class UpdateSuccess implements Action {
    public readonly type = SmartDocTemplatesActionType.UPDATE_SUCCESS;

    public constructor(public payload: { template: SmartDocTemplateModel }) {
    }
  }

  export class UpdateFailure implements Action {
    public readonly type = SmartDocTemplatesActionType.UPDATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Delete implements Action {
    public readonly type = SmartDocTemplatesActionType.DELETE;

    public constructor(public payload: { templateId: string }) {
    }
  }

  export class DeleteSuccess implements Action {
    public readonly type = SmartDocTemplatesActionType.DELETE_SUCCESS;

    public constructor(public payload: { templateId: string }) {
    }
  }

  export class DeleteFailure implements Action {
    public readonly type = SmartDocTemplatesActionType.DELETE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Select implements Action {
    public readonly type = SmartDocTemplatesActionType.SELECT;

    public constructor(public payload: { templateId: string, documentId: string, partIndex: number }) {
    }
  }

  export class Deselect implements Action {
    public readonly type = SmartDocTemplatesActionType.DESELECT;
  }

  export class AddPart implements Action {
    public readonly type = SmartDocTemplatesActionType.ADD_PART;

    public constructor(public payload: { templateId: string, partIndex?: number, part: SmartDocTemplatePartModel }) {
    }
  }

  export class UpdatePart implements Action {
    public readonly type = SmartDocTemplatesActionType.UPDATE_PART;

    public constructor(public payload: { templateId: string, partIndex: number, part: SmartDocTemplatePartModel }) {
    }
  }

  export class RemovePart implements Action {
    public readonly type = SmartDocTemplatesActionType.REMOVE_PART;

    public constructor(public payload: { templateId: string, partIndex: number }) {
    }
  }

  export class MovePart implements Action {
    public readonly type = SmartDocTemplatesActionType.MOVE_PART;

    public constructor(public payload: { templateId: string, oldIndex: number, newIndex: number }) {
    }
  }

  export type All =
    Get | GetSuccess | GetFailure |
    Create | CreateSuccess | CreateFailure |
    Update | UpdateSuccess | UpdateFailure |
    Delete | DeleteSuccess | DeleteFailure |
    Select | Deselect |
    AddPart | UpdatePart | RemovePart | MovePart;
}
