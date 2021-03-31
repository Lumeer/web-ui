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
import {DefaultWorkspace, User, UserHints} from './user';
import {InvitationType} from '../../model/invitation-type';
import {PaymentStats} from '../organizations/payment/payment';
import {UserHintsDto} from '../../dto/user.dto';

export enum UsersActionType {
  GET = '[Users] Get',
  GET_SUCCESS = '[Users] Get :: Success',
  GET_FAILURE = '[Users] Get :: Failure',

  GET_CURRENT_USER = '[Users] Get current user',
  GET_CURRENT_USER_WITH_LAST_LOGIN = '[Users] Get current user with last login',
  GET_CURRENT_USER_SUCCESS = '[Users] Get current user:: Success',

  RESEND_VERIFICATION_EMAIL = '[Users] Resend verification email',

  PATCH_CURRENT_USER = '[Users] Patch Current',

  SAVE_DEFAULT_WORKSPACE = '[Users] Save default workspace',
  SAVE_DEFAULT_WORKSPACE_SUCCESS = '[Users] Save default workspace :: Success',
  SAVE_DEFAULT_WORKSPACE_FAILURE = '[Users] Save default workspace :: Failure',

  CREATE = '[Users] Create',
  CREATE_SUCCESS = '[Users] Create :: Success',
  CREATE_FAILURE = '[Users] Create :: Failure',

  INVITE = '[Users] Invite',
  INVITE_SUCCESS = '[Users] Invite :: Success',
  INVITE_FAILURE = '[Users] Invite :: Failure',
  INVITATION_EXCEEDED = '[Users] Invitation Exceeded',

  UPDATE = '[Users] Update',
  UPDATE_SUCCESS = '[Users] Update :: Success',
  UPDATE_FAILURE = '[Users] Update :: Failure',

  DELETE = '[Users] Delete',
  DELETE_SUCCESS = '[Users] Delete :: Success',
  DELETE_FAILURE = '[Users] Delete :: Failure',

  SET_PENDING = '[Users] Set Pending',

  CLEAR = '[Users] Clear',

  REFERRALS = '[Users] Referrals',
  REFERRALS_SUCCESS = '[Users] Referrals :: Success',
  REFERRALS_FAILURE = '[Users] Referrals :: Failure',

  GET_HINTS = '[User] Get Hints',
  GET_HINTS_SUCCESS = '[User] Get Hints :: Success',
  GET_HINTS_FAILURE = '[User] Get Hints :: Failure',

  PATCH_USER_SETTINGS = '[User] Patch User Settings',
  PATCH_USER_SETTINGS_SUCCESS = '[User] Patch User Settings :: Success',
  PATCH_USER_SETTINGS_FAILURE = '[User] Patch User Settings :: Failure',

  UPDATE_HINTS = '[User] Update Hints',
  UPDATE_HINTS_SUCCESS = '[User] Update Hints :: Success',
  UPDATE_HINTS_FAILURE = '[User] Update Hints :: Failure',

  SET_HINT = '[User] Set Hint',
  SET_HINT_SUCCESS = '[User] Set Hint :: Success',
  SET_HINT_FAILURE = '[User] Set Hint :: Failure',
}

export namespace UsersAction {
  export class Get implements Action {
    public readonly type = UsersActionType.GET;

    public constructor(public payload: {organizationId: string}) {}
  }

  export class GetSuccess implements Action {
    public readonly type = UsersActionType.GET_SUCCESS;

    public constructor(public payload: {organizationId: string; users: User[]}) {}
  }

  export class GetCurrentUser implements Action {
    public readonly type = UsersActionType.GET_CURRENT_USER;

    public constructor(public payload: {onSuccess?: () => void; onFailure?: () => void} = {}) {}
  }

  export class ResendVerificationEmail implements Action {
    public readonly type = UsersActionType.RESEND_VERIFICATION_EMAIL;

    public constructor(public payload: {onSuccess?: () => void; onFailure?: () => void} = {}) {}
  }

  export class GetCurrentUserWithLastLogin implements Action {
    public readonly type = UsersActionType.GET_CURRENT_USER_WITH_LAST_LOGIN;
  }

  export class GetCurrentUserSuccess implements Action {
    public readonly type = UsersActionType.GET_CURRENT_USER_SUCCESS;

    public constructor(public payload: {user: User}) {}
  }

  export class PatchCurrentUser implements Action {
    public readonly type = UsersActionType.PATCH_CURRENT_USER;

    public constructor(public payload: {user: Partial<User>; onSuccess?: () => void; onFailure?: () => void}) {}
  }

  export class SaveDefaultWorkspace implements Action {
    public readonly type = UsersActionType.SAVE_DEFAULT_WORKSPACE;

    public constructor(public payload: {defaultWorkspace: DefaultWorkspace}) {}
  }

  export class SaveDefaultWorkspaceSuccess implements Action {
    public readonly type = UsersActionType.SAVE_DEFAULT_WORKSPACE_SUCCESS;

    public constructor(public payload: {user: User; defaultWorkspace: DefaultWorkspace}) {}
  }

  export class SaveDefaultWorkspaceFailure implements Action {
    public readonly type = UsersActionType.SAVE_DEFAULT_WORKSPACE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class GetFailure implements Action {
    public readonly type = UsersActionType.GET_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Create implements Action {
    public readonly type = UsersActionType.CREATE;

    public constructor(public payload: {organizationId: string; user: User}) {}
  }

  export class CreateSuccess implements Action {
    public readonly type = UsersActionType.CREATE_SUCCESS;

    public constructor(public payload: {user: User}) {}
  }

  export class CreateFailure implements Action {
    public readonly type = UsersActionType.CREATE_FAILURE;

    public constructor(public payload: {error: any; organizationId: string}) {}
  }

  export class InviteUsers implements Action {
    public readonly type = UsersActionType.INVITE;

    public constructor(
      public payload: {organizationId: string; projectId: string; users: User[]; invitationType?: InvitationType}
    ) {}
  }

  export class InviteSuccess implements Action {
    public readonly type = UsersActionType.INVITE_SUCCESS;

    public constructor(public payload: {users: User[]}) {}
  }

  export class InviteFailure implements Action {
    public readonly type = UsersActionType.INVITE_FAILURE;

    public constructor(public payload: {error: any; organizationId: string; projectId: string}) {}
  }

  export class InvitationExceeded implements Action {
    public readonly type = UsersActionType.INVITATION_EXCEEDED;

    public constructor(public payload: {organizationId: string}) {}
  }

  export class Update implements Action {
    public readonly type = UsersActionType.UPDATE;

    public constructor(public payload: {organizationId: string; user: User}) {}
  }

  export class UpdateSuccess implements Action {
    public readonly type = UsersActionType.UPDATE_SUCCESS;

    public constructor(public payload: {user: User}) {}
  }

  export class UpdateFailure implements Action {
    public readonly type = UsersActionType.UPDATE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = UsersActionType.DELETE;

    public constructor(public payload: {organizationId: string; userId: string}) {}
  }

  export class DeleteSuccess implements Action {
    public readonly type = UsersActionType.DELETE_SUCCESS;

    public constructor(public payload: {userId: string}) {}
  }

  export class DeleteFailure implements Action {
    public readonly type = UsersActionType.DELETE_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class SetPending implements Action {
    public readonly type = UsersActionType.SET_PENDING;

    public constructor(public payload: {pending: boolean}) {}
  }

  export class Clear implements Action {
    public readonly type = UsersActionType.CLEAR;
  }

  export class Referrals implements Action {
    public readonly type = UsersActionType.REFERRALS;
  }

  export class ReferralsSuccess implements Action {
    public readonly type = UsersActionType.REFERRALS_SUCCESS;

    public constructor(public payload: {referrals: PaymentStats}) {}
  }

  export class ReferralsFailure implements Action {
    public readonly type = UsersActionType.REFERRALS_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class GetHints implements Action {
    public readonly type = UsersActionType.GET_HINTS;
  }

  export class GetHintsSuccess implements Action {
    public readonly type = UsersActionType.GET_HINTS_SUCCESS;

    public constructor(public payload: {hints: UserHintsDto}) {}
  }

  export class GetHintsFailure implements Action {
    public readonly type = UsersActionType.GET_HINTS_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class UpdateHints implements Action {
    public readonly type = UsersActionType.UPDATE_HINTS;

    public constructor(public payload: {hints: UserHints}) {}
  }

  export class UpdateHintsSuccess implements Action {
    public readonly type = UsersActionType.UPDATE_HINTS_SUCCESS;

    public constructor(public payload: {hints: UserHints}) {}
  }

  export class UpdateHintsFailure implements Action {
    public readonly type = UsersActionType.UPDATE_HINTS_FAILURE;

    public constructor(public payload: {error: any; originalHints: UserHints}) {}
  }

  export class SetHint implements Action {
    public readonly type = UsersActionType.SET_HINT;

    public constructor(public payload: {hint: string; value: any}) {}
  }

  export class SetHintSuccess implements Action {
    public readonly type = UsersActionType.SET_HINT_SUCCESS;

    public constructor(public payload: {hints: UserHints}) {}
  }

  export class SetHintFailure implements Action {
    public readonly type = UsersActionType.SET_HINT_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export type All =
    | Get
    | GetSuccess
    | GetFailure
    | GetCurrentUser
    | ResendVerificationEmail
    | GetCurrentUserWithLastLogin
    | GetCurrentUserSuccess
    | PatchCurrentUser
    | Create
    | CreateSuccess
    | CreateFailure
    | InviteUsers
    | InviteSuccess
    | InviteFailure
    | Update
    | UpdateSuccess
    | UpdateFailure
    | SaveDefaultWorkspace
    | SaveDefaultWorkspaceSuccess
    | SaveDefaultWorkspaceFailure
    | Delete
    | DeleteSuccess
    | DeleteFailure
    | SetPending
    | Clear
    | Referrals
    | ReferralsSuccess
    | ReferralsFailure
    | GetHints
    | GetHintsSuccess
    | GetHintsFailure
    | UpdateHints
    | UpdateHintsSuccess
    | UpdateHintsFailure
    | SetHint
    | SetHintSuccess
    | SetHintFailure;
}
