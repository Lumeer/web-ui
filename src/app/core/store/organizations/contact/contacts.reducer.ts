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

import {ContactsAction, ContactsActionType} from './contacts.action';
import {contactsAdapter, ContactsState, initialContactsState} from './contacts.state';
import {Contact} from './contact';

export function contactsReducer(
  state: ContactsState = initialContactsState,
  action: ContactsAction.All
): ContactsState {
  switch (action.type) {
    case ContactsActionType.GET_CONTACT_SUCCESS:
      return addOrUpdateContact(state, action.payload.contact);
    case ContactsActionType.SET_CONTACT_SUCCESS:
      return addOrUpdateContact(state, action.payload.contact);
    default:
      return state;
  }
}

function addOrUpdateContact(state: ContactsState, contact: Contact): ContactsState {
  const oldContact = state.entities[contact.organizationId];
  if (!oldContact) {
    return contactsAdapter.addOne(contact, state);
  }

  if (isContactNewer(contact, oldContact)) {
    return contactsAdapter.upsertOne(contact, state);
  }
  return state;
}

function isContactNewer(contact: Contact, oldContact: Contact): boolean {
  return contact.version && (!oldContact.version || contact.version > oldContact.version);
}
