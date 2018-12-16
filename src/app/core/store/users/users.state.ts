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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {Dictionary} from '@ngrx/entity/src/models';
import {createSelector} from '@ngrx/store';
import {isNullOrUndefined} from 'util';
import {AppState} from '../app.state';
import {Group} from '../groups/group';
import {selectGroupsDictionary} from '../groups/groups.state';
import {Organization} from '../organizations/organization';
import {selectOrganizationByWorkspace} from '../organizations/organizations.state';
import {filterUserFunctions, filterUsersByOrganization} from './user.filters';
import {User} from './user';

export interface UsersState extends EntityState<User> {
  pending: boolean;
  loadedForOrganizationId: string;
  currentUser: User;
}

export const usersAdapter = createEntityAdapter<User>();

export const initialUsersState: UsersState = usersAdapter.getInitialState({
  pending: false,
  loadedForOrganizationId: undefined,
  currentUser: undefined,
});

export const selectUsersState = (state: AppState) => state.users;

const selectAllUsersRaw = createSelector(
  selectUsersState,
  usersAdapter.getSelectors().selectAll
);
export const selectUsersDictionary = createSelector(
  selectUsersState,
  usersAdapter.getSelectors().selectEntities
);
export const selectAllUsers = createSelector(
  selectAllUsersRaw,
  users => filterUserFunctions(users)
);
export const selectUsersLoadedForOrganization = createSelector(
  selectUsersState,
  usersState => usersState.loadedForOrganizationId
);

export const selectCurrentUser = createSelector(
  selectUsersState,
  usersState => usersState.currentUser
);

export const selectUsersPending = createSelector(
  selectUsersState,
  state => state.pending
);

export const selectUserById = (userId: string) =>
  createSelector(
    selectUsersDictionary,
    usersMap => usersMap[userId]
  );

export const selectCurrentUserForWorkspace = createSelector(
  selectCurrentUser,
  selectGroupsDictionary,
  selectOrganizationByWorkspace,
  (user, groups, organization) =>
    user ? (organization ? mapGroupsOnUser(user, organization.id, groups) : user) : undefined
);

export const selectCurrentUserForOrganization = (organization: Organization) =>
  createSelector(
    selectCurrentUser,
    selectGroupsDictionary,
    (user, groups) => {
      return mapGroupsOnUser(user, organization.id, groups);
    }
  );

export const selectUsersForWorkspace = createSelector(
  selectAllUsers,
  selectGroupsDictionary,
  selectOrganizationByWorkspace,
  (users, groups, organization) => {
    return filterUsersByOrganization(users, organization).map(user => mapGroupsOnUser(user, organization.id, groups));
  }
);

export function mapGroupsOnUser(user: User, organizationId: string, groups: Dictionary<Group>) {
  const groupIds = (user.groupsMap && user.groupsMap[organizationId]) || [];
  user.groups = groupIds.map(id => groups[id]).filter(group => !isNullOrUndefined(group));
  return user;
}
