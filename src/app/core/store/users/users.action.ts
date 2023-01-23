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
import {DefaultWorkspace, User, UserHints, UserOnboarding} from './user';
import {PaymentStats} from '../organizations/payment/payment';
import {UserInvitation} from '../../model/user-invitation';

export enum UsersActionType {
  GET = '[Users] Get',
  GET_SUCCESS = '[Users] Get :: Success',
  GET_FAILURE = '[Users] Get :: Failure',

  GET_CURRENT_USER = '[Users] Get current user',
  GET_CURRENT_USER_SUCCESS = '[Users] Get current user:: Success',

  RESEND_VERIFICATION_EMAIL = '[Users] Resend verification email',

  PATCH_CURRENT_USER = '[Users] Patch Current',

  SET_TEAMS = '[Users] Set Teams',
  SET_TEAMS_SUCCESS = '[Users] Set Teams :: Success',
  SET_TEAMS_FAILURE = '[Users] Set Teams :: Failure',

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

  LOG_EVENT = '[Users] Log Event',

  CLEAR = '[Users] Clear',

  REFERRALS = '[Users] Referrals',
  REFERRALS_SUCCESS = '[Users] Referrals :: Success',
  REFERRALS_FAILURE = '[Users] Referrals :: Failure',

  UPDATE_HINTS = '[User] Update Hints',
  UPDATE_HINTS_SUCCESS = '[User] Update Hints :: Success',
  UPDATE_HINTS_FAILURE = '[User] Update Hints :: Failure',

  BOOK_PRODUCT_DEMO = '[User] Book Product Demo',
  BOOK_PRODUCT_DEMO_SUCCESS = '[User] Book Product Demo :: Success',
  BOOK_PRODUCT_DEMO_FAILURE = '[User] Book Product Demo :: Failure',

  GET_IN_TOUCH = '[User] Get In Touch',
  GET_IN_TOUCH_SUCCESS = '[User] Get In Touch :: Success',
  GET_IN_TOUCH_FAILURE = '[User] Get In Touch :: Failure',

  SET_HINT = '[User] Set Hint',
  SET_HINT_SUCCESS = '[User] Set Hint :: Success',
  SET_HINT_FAILURE = '[User] Set Hint :: Failure',

  SET_ONBOARDING = '[User] Set Onboarding',
  SET_ONBOARDING_SUCCESS = '[User] Set Onboarding :: Success',
}

export namespace UsersAction {
  export class Get implements Action {
    public readonly type = UsersActionType.GET;

    public constructor(public payload: {organizationId: string; force?: boolean}) {}
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

  export class GetCurrentUserSuccess implements Action {
    public readonly type = UsersActionType.GET_CURRENT_USER_SUCCESS;

    public constructor(public payload: {user: User}) {}
  }

  export class PatchCurrentUser implements Action {
    public readonly type = UsersActionType.PATCH_CURRENT_USER;

    public constructor(public payload: {user: Partial<User>; onSuccess?: () => void; onFailure?: () => void}) {}
  }

  export class SetTeams implements Action {
    public readonly type = UsersActionType.SET_TEAMS;

    public constructor(public payload: {organizationId: string; user: User; teams: string[]}) {}
  }

  export class SetTeamsSuccess implements Action {
    public readonly type = UsersActionType.SET_TEAMS_SUCCESS;

    public constructor(public payload: {user: User; groups: string[]}) {}
  }

  export class SetTeamsFailure implements Action {
    public readonly type = UsersActionType.SET_TEAMS_FAILURE;

    public constructor(public payload: {error: any}) {}
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
      public payload: {
        organizationId: string;
        projectId: string;
        invitations: UserInvitation[];
        onSuccess?: () => void;
        onFailure?: () => void;
      }
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

  export class BookProductDemo implements Action {
    public readonly type = UsersActionType.BOOK_PRODUCT_DEMO;

    public constructor(
      public payload: {
        message: string;
        onSuccess?: () => void;
        onFailure?: () => void;
      }
    ) {}
  }

  export class BookProductDemoSuccess implements Action {
    public readonly type = UsersActionType.BOOK_PRODUCT_DEMO_SUCCESS;
  }

  export class BookProductDemoFailure implements Action {
    public readonly type = UsersActionType.BOOK_PRODUCT_DEMO_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class GetInTouch implements Action {
    public readonly type = UsersActionType.GET_IN_TOUCH;

    public constructor(
      public payload: {
        message: string;
        onSuccess?: () => void;
        onFailure?: () => void;
      }
    ) {}
  }

  export class GetInTouchSuccess implements Action {
    public readonly type = UsersActionType.GET_IN_TOUCH_SUCCESS;
  }

  export class GetInTouchFailure implements Action {
    public readonly type = UsersActionType.GET_IN_TOUCH_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class Delete implements Action {
    public readonly type = UsersActionType.DELETE;

    public constructor(public payload: {organizationId: string; userId: string; onSuccess?: () => void}) {}
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

  export class SetOnboarding implements Action {
    public readonly type = UsersActionType.SET_ONBOARDING;

    public constructor(public payload: {key: keyof UserOnboarding; value: any}) {}
  }

  export class SetOnboardingSuccess implements Action {
    public readonly type = UsersActionType.SET_ONBOARDING_SUCCESS;

    public constructor(public payload: {onboarding: UserOnboarding}) {}
  }

  export class LogEvent implements Action {
    public readonly type = UsersActionType.LOG_EVENT;

    public constructor(public payload: {event: string}) {}
  }

  export type All =
    | Get
    | GetSuccess
    | GetFailure
    | GetCurrentUser
    | ResendVerificationEmail
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
    | SetTeams
    | SetTeamsSuccess
    | SetTeamsFailure
    | UpdateHints
    | UpdateHintsSuccess
    | UpdateHintsFailure
    | SetHint
    | SetHintSuccess
    | SetHintFailure
    | SetOnboarding
    | SetOnboardingSuccess;
}
