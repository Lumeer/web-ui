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
import {Contact} from './contact';

export enum ContactsActionType {
  GET_CONTACT = '[Organizations] Get Contact',
  GET_CONTACT_SUCCESS = '[Organizations] Get Contact :: Success',
  GET_CONTACT_FAILURE = '[Organizations] Get Contact :: Failure',

  SET_CONTACT = '[Organizations] Set Contact',
  SET_CONTACT_SUCCESS = '[Organizations] Set Contact :: Success',
  SET_CONTACT_FAILURE = '[Organizations] Set Contact :: Failure',
}

export namespace ContactsAction {
  export class GetContact implements Action {
    public readonly type = ContactsActionType.GET_CONTACT;

    public constructor(public payload: {organizationCode: string}) {}
  }

  export class GetContactSuccess implements Action {
    public readonly type = ContactsActionType.GET_CONTACT_SUCCESS;

    public constructor(public payload: {contact: Contact}) {}
  }

  export class GetContactFailure implements Action {
    public readonly type = ContactsActionType.GET_CONTACT_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export class SetContact implements Action {
    public readonly type = ContactsActionType.SET_CONTACT;

    public constructor(public payload: {organizationCode: string; contact: Contact}) {}
  }

  export class SetContactSuccess implements Action {
    public readonly type = ContactsActionType.SET_CONTACT_SUCCESS;

    public constructor(public payload: {contact: Contact}) {}
  }

  export class SetContactFailure implements Action {
    public readonly type = ContactsActionType.SET_CONTACT_FAILURE;

    public constructor(public payload: {error: any}) {}
  }

  export type All =
    | GetContact
    | GetContactSuccess
    | GetContactFailure
    | SetContact
    | SetContactSuccess
    | SetContactFailure;
}
