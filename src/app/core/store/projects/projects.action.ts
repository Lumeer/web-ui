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

import {Action} from '@ngrx/store';
import {Permission, PermissionType} from '../permissions/permissions';
import {Project} from './project';
import {Workspace} from '../navigation/workspace';
import {NavigationExtras} from '@angular/router';
import {SampleDataType} from '../../model/sample-data-type';

export enum ProjectsActionType {
  GET = '[Projects] Get',
  GET_SINGLE = '[Projects] Get Single',
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

  CHANGE_PERMISSION = '[Projects] Change Permission',
  CHANGE_PERMISSION_SUCCESS = '[Projects] Change Permission :: Success',
  CHANGE_PERMISSION_FAILURE = '[Projects] Change Permission :: Failure',

  APPLY_TEMPLATE = '[Projects] Apply Template',
  APPLY_TEMPLATE_FAILURE = '[Projects] Apply Template :: Failure',

  CREATE_SAMPLE_DATA = '[Projects] Create Sample Data',

  COPY = '[Projects] Copy',
  COPY_FAILURE = '[Projects] Copy :: Failure',

  GET_TEMPLATES = '[Projects] Get Templates',
  GET_TEMPLATES_SUCCESS = '[Projects] Get Templates :: Success',
  GET_TEMPLATES_FAILURE = '[Projects] Get Templates :: Failure',

  DISMISS_WARNING_MESSAGE = '[Projects] Dismiss Warning Message',
  SWITCH_WORKSPACE = '[Projects] Switch Workspace',
  CLEAR_WORKSPACE_DATA = '[Projects] Clear Workspace Data',
}

export namespace ProjectsAction {
  export class Get implements Action {
    public readonly type = ProjectsActionType.GET;

    public constructor(public payload: {organizationId: string; force?: boolean}) {}
  }

  export class GetSingle implements Action {
    public readonly type = ProjectsActionType.GET_SINGLE;

    public constructor(public payload: {organizationId: string; projectId: string}) {}
  }

  export class GetSuccess implements Action {
    public readonly type = ProjectsActionType.GET_SUCCESS;

    public constructor(public payload: {organizationId: string; projects: Project[]}) {}
  }

  export class GetFailure implements Action {
    public readonly type = ProjectsActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class GetOneSuccess implements Action {
    public readonly type = ProjectsActionType.GET_ONE_SUCCESS;

    public constructor(public payload: {project: Project}) {}
  }

  export class GetCodes implements Action {
    public readonly type = ProjectsActionType.GET_CODES;

    public constructor(public payload: {organizationIds: string[]}) {}
  }

  export class GetCodesSuccess implements Action {
    public readonly type = ProjectsActionType.GET_CODES_SUCCESS;

    public constructor(public payload: {codesMap: Record<string, string[]>}) {}
  }

  export class GetCodesFailure implements Action {
    public readonly type = ProjectsActionType.GET_CODES_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Create implements Action {
    public readonly type = ProjectsActionType.CREATE;

    public constructor(
      public payload: {
        project: Project;
        templateId?: string;
        copyProject?: Project;
        navigationExtras?: NavigationExtras;
        onSuccess?: (project: Project) => void;
        onFailure?: () => void;
      }
    ) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = ProjectsActionType.CREATE_SUCCESS;

    public constructor(public payload: {project: Project}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = ProjectsActionType.CREATE_FAILURE;

    public constructor(public payload: {organizationCode: string; error: any}) {}
  }

  export class Update implements Action {
    public readonly type = ProjectsActionType.UPDATE;

    public constructor(public payload: {project: Project; workspace?: Workspace}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = ProjectsActionType.UPDATE_SUCCESS;

    public constructor(public payload: {project: Project; oldCode?: string}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = ProjectsActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class ApplyTemplate implements Action {
    public readonly type = ProjectsActionType.APPLY_TEMPLATE;

    public constructor(public payload: {organizationId: string; projectId: string; templateId: string}) {}
  }

  export class ApplyTemplateFailure implements Action {
    public readonly type = ProjectsActionType.APPLY_TEMPLATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class CreateSampleData implements Action {
    public readonly type = ProjectsActionType.CREATE_SAMPLE_DATA;

    public constructor(
      public payload: {type: SampleDataType; errorMessage: string; onSuccess?: () => void; onFailure?: () => void}
    ) {}
  }

  export class Copy implements Action {
    public readonly type = ProjectsActionType.COPY;

    public constructor(public payload: {organizationId: string; projectId: string; copyProject: Project}) {}
  }

  export class CopyFailure implements Action {
    public readonly type = ProjectsActionType.COPY_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = ProjectsActionType.DELETE;

    public constructor(public payload: {organizationId: string; projectId: string}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = ProjectsActionType.DELETE_SUCCESS;

    public constructor(public payload: {projectId: string; organizationId?: string; projectCode?: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = ProjectsActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class GetTemplates implements Action {
    public readonly type = ProjectsActionType.GET_TEMPLATES;
  }

  export class GetTemplatesSuccess implements Action {
    public readonly type = ProjectsActionType.GET_TEMPLATES_SUCCESS;

    public constructor(public payload: {templates: Project[]}) {}
  }

  export class GetTemplatesFailure implements Action {
    public readonly type = ProjectsActionType.GET_TEMPLATES_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class ChangePermission implements Action {
    public readonly type = ProjectsActionType.CHANGE_PERMISSION;

    public constructor(
      public payload: {
        projectId: string;
        type: PermissionType;
        permissions: Permission[];
        currentPermissions: Permission[];
        workspace?: Workspace;
      }
    ) {}
  }

  export class ChangePermissionSuccess implements Action {
    public readonly type = ProjectsActionType.CHANGE_PERMISSION_SUCCESS;

    public constructor(public payload: {projectId: string; type: PermissionType; permissions: Permission[]}) {}
  }

  export class ChangePermissionFailure implements Action {
    public readonly type = ProjectsActionType.CHANGE_PERMISSION_FAILURE;

    public constructor(
      public payload: {projectId: string; type: PermissionType; permissions: Permission[]; error: any}
    ) {}
  }

  export class DismissWarningMessage implements Action {
    public readonly type = ProjectsActionType.DISMISS_WARNING_MESSAGE;

    public constructor(public payload: {projectId: string}) {}
  }

  export class SwitchWorkspace implements Action {
    public readonly type = ProjectsActionType.SWITCH_WORKSPACE;

    public constructor(public payload: {organizationId: string; projectId: string; nextAction?: Action}) {}
  }

  export class ClearWorkspaceData implements Action {
    public readonly type = ProjectsActionType.CLEAR_WORKSPACE_DATA;

    public constructor(public payload: {nextAction?: Action}) {}
  }

  export type All =
    | Get
    | GetSingle
    | GetSuccess
    | GetFailure
    | GetOneSuccess
    | GetCodes
    | GetCodesSuccess
    | GetCodesFailure
    | Create
    | CreateSuccess
    | CreateFailure
    | Update
    | UpdateSuccess
    | UpdateFailure
    | Delete
    | DeleteSuccess
    | DeleteFailure
    | ChangePermission
    | ChangePermissionSuccess
    | ChangePermissionFailure
    | ApplyTemplate
    | ApplyTemplateFailure
    | GetTemplates
    | GetTemplatesSuccess
    | GetTemplatesFailure
    | DismissWarningMessage
    | SwitchWorkspace
    | ClearWorkspaceData;
}
