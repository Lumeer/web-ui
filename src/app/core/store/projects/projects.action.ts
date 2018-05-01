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
import {ProjectModel} from './project.model';
import {PermissionModel, PermissionType} from '../permissions/permissions.model';

export enum ProjectsActionType {

  GET = '[Projects] Get',
  GET_SUCCESS = '[Projects] Get :: Success',
  GET_FAILURE = '[Projects] Get :: Failure',

  GET_ONE_SUCCESS = '[Projects] Get one :: Success',

  GET_CODES = '[Projects] Get codes',
  GET_CODES_SUCCESS = '[Projects] Get codes :: Success',
  GET_CODES_FAILURE = '[Projects] Get codes :: Failure',

  CREATE = '[Projects] Create',
  CREATE_SUCCESS = '[Projects] Create :: Success',
  CREATE_FAILURE = '[Projects] Create :: Failure',

  UPDATE = '[Projects] Update',
  UPDATE_SUCCESS = '[Projects] Update :: Success',
  UPDATE_FAILURE = '[Projects] Update :: Failure',

  DELETE = '[Projects] Delete',
  DELETE_SUCCESS = '[Projects] Delete :: Success',
  DELETE_FAILURE = '[Projects] Delete :: Failure',

  SELECT = '[Projects] Select',

  CHANGE_PERMISSION = '[Projects] Change Permission',
  CHANGE_PERMISSION_SUCCESS = '[Projects] Change Permission :: Success',
  CHANGE_PERMISSION_FAILURE = '[Projects] Change Permission :: Failure'

}

export namespace ProjectsAction {

  export class Get implements Action {
    public readonly type = ProjectsActionType.GET;

    public constructor(public payload: { organizationId: string }) {
    }
  }

  export class GetSuccess implements Action {
    public readonly type = ProjectsActionType.GET_SUCCESS;

    public constructor(public payload: { organizationId: string, projects: ProjectModel[] }) {
    }
  }

  export class GetFailure implements Action {
    public readonly type = ProjectsActionType.GET_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class GetOneSuccess implements Action {
    public readonly type = ProjectsActionType.GET_ONE_SUCCESS;

    public constructor(public payload: { project: ProjectModel }) {
    }
  }

  export class GetCodes implements Action {
    public readonly type = ProjectsActionType.GET_CODES;

    public constructor(public payload: { organizationId: string }) {
    }
  }

  export class GetCodesSuccess implements Action {
    public readonly type = ProjectsActionType.GET_CODES_SUCCESS;

    public constructor(public payload: { organizationId: string, projectCodes: string[] }) {
    }
  }

  export class GetCodesFailure implements Action {
    public readonly type = ProjectsActionType.GET_CODES_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Create implements Action {
    public readonly type = ProjectsActionType.CREATE;

    public constructor(public payload: { project: ProjectModel }) {
    }
  }

  export class CreateSuccess implements Action {
    public readonly type = ProjectsActionType.CREATE_SUCCESS;

    public constructor(public payload: { project: ProjectModel }) {
    }
  }

  export class CreateFailure implements Action {
    public readonly type = ProjectsActionType.CREATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Update implements Action {
    public readonly type = ProjectsActionType.UPDATE;

    public constructor(public payload: { project: ProjectModel }) {
    }
  }

  export class UpdateSuccess implements Action {
    public readonly type = ProjectsActionType.UPDATE_SUCCESS;

    public constructor(public payload: { project: ProjectModel }) {
    }
  }

  export class UpdateFailure implements Action {
    public readonly type = ProjectsActionType.UPDATE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Delete implements Action {
    public readonly type = ProjectsActionType.DELETE;

    public constructor(public payload: { organizationId: string, projectId: string }) {
    }
  }

  export class DeleteSuccess implements Action {
    public readonly type = ProjectsActionType.DELETE_SUCCESS;

    public constructor(public payload: { projectId: string }) {
    }
  }

  export class DeleteFailure implements Action {
    public readonly type = ProjectsActionType.DELETE_FAILURE;

    public constructor(public payload: { error: any }) {
    }
  }

  export class Select implements Action {
    public readonly type = ProjectsActionType.SELECT;

    public constructor(public payload: { projectId: string }) {
    }
  }

  export class ChangePermission implements Action {
    public readonly type = ProjectsActionType.CHANGE_PERMISSION;

    public constructor(public payload: { projectId: string, type: PermissionType, permission: PermissionModel, currentPermission: PermissionModel }) {
    }
  }

  export class ChangePermissionSuccess implements Action {
    public readonly type = ProjectsActionType.CHANGE_PERMISSION_SUCCESS;

    public constructor(public payload: { projectId: string, type: PermissionType, permission: PermissionModel }) {
    }
  }

  export class ChangePermissionFailure implements Action {
    public readonly type = ProjectsActionType.CHANGE_PERMISSION_FAILURE;

    public constructor(public payload: { projectId: string, type: PermissionType, permission: PermissionModel, error: any }) {
    }
  }

  export type All = Select |
    Get | GetSuccess | GetFailure | GetOneSuccess |
    GetCodes | GetCodesSuccess | GetCodesFailure |
    Create | CreateSuccess | CreateFailure |
    Update | UpdateSuccess | UpdateFailure |
    Delete | DeleteSuccess | DeleteFailure | Select |
    ChangePermission | ChangePermissionSuccess | ChangePermissionFailure;
}
