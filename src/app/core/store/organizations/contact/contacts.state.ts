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
import {EntityState, createEntityAdapter} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';

import {AppState} from '../../app.state';
import {selectOrganizationByWorkspace} from '../organizations.state';
import {Contact} from './contact';

export interface ContactsState extends EntityState<Contact> {}

export const contactsAdapter = createEntityAdapter<Contact>({selectId: contact => contact.organizationId});

export const initialContactsState: ContactsState = contactsAdapter.getInitialState({});

export const selectContactsState = (state: AppState) => state.contacts;
export const selectAllContacts = createSelector(selectContactsState, contactsAdapter.getSelectors().selectAll);

export const selectContactByWorkspace = createSelector(
  selectAllContacts,
  selectOrganizationByWorkspace,
  (contacts, organization) => {
    return contacts.find(contact => organization && contact.organizationId === organization.id);
  }
);
