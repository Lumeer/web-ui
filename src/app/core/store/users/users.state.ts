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

import {createEntityAdapter, EntityState} from '@ngrx/entity';
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {Team} from '../teams/team';
import {selectTeamsByOrganization, selectTeamsForWorkspace} from '../teams/teams.state';
import {User} from './user';
import {filterUsersByOrganization} from './user.filters';
import {Organization} from '../organizations/organization';
import {selectOrganizationByWorkspace} from '../organizations/organizations.state';
import {selectNavigation} from '../navigation/navigation.state';

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

export const selectAllUsers = createSelector(selectUsersState, usersAdapter.getSelectors().selectAll);
export const selectUsersDictionary = createSelector(selectUsersState, usersAdapter.getSelectors().selectEntities);

export const selectUsersLoadedForOrganization = createSelector(
  selectUsersState,
  usersState => usersState.loadedForOrganizationId
);

export const selectCurrentUser = createSelector(selectUsersState, usersState => usersState.currentUser);

export const selectUsersPending = createSelector(selectUsersState, state => state.pending);

export const selectUserById = (userId: string) => createSelector(selectUsersDictionary, usersMap => usersMap[userId]);

export const selectUserByEmail = (email: string) =>
  createSelector(selectAllUsers, users => users && users.find(user => user.email === email));

export const selectUsersByEmails = (emails: string[]) =>
  createSelector(selectAllUsers, users => users && users.find(user => emails.indexOf(user.email) >= 0));

export const selectCurrentUserForWorkspace = createSelector(
  selectCurrentUser,
  selectTeamsForWorkspace,
  (user, groups) => user && mapGroupsOnUser(user, groups)
);

export const selectCurrentUserForOrganization = (organization: Organization) =>
  createSelector(
    selectCurrentUser,
    selectTeamsByOrganization(organization.id),
    (user, groups) => user && mapGroupsOnUser(user, groups)
  );

export const selectUsersForWorkspace = createSelector(
  selectAllUsers,
  selectTeamsForWorkspace,
  selectOrganizationByWorkspace,
  (users, groups, organization) => {
    return filterUsersByOrganization(users, organization).map(user => mapGroupsOnUser(user, groups));
  }
);

export const selectUserByWorkspace = createSelector(
  selectUsersDictionary,
  selectNavigation,
  selectTeamsForWorkspace,
  (usersMap, navigation, teams) => mapGroupsOnUser(usersMap[navigation.userId], teams)
);

export function mapGroupsOnUser(user: User, groups: Team[]): User {
  return (
    user && {
      ...user,
      teams: groups.filter(group => group.users?.includes(user.id)),
    }
  );
}
