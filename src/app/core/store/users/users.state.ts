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
import {createSelector} from '@ngrx/store';
import {AppState} from '../app.state';
import {UserModel} from './user.model';
import {selectOrganizationByWorkspace} from "../organizations/organizations.state";
import {selectAllGroups} from "../groups/groups.state";
import {UserFilters} from "./user.filters";
import {GroupModel} from "../groups/group.model";

export interface UsersState extends EntityState<UserModel> {

}

export const usersAdapter = createEntityAdapter<UserModel>();

export const initialUsersState: UsersState = usersAdapter.getInitialState({filter: null});

export const selectUsersState = (state: AppState) => state.users;

const selectAllUsersRaw = createSelector(selectUsersState, usersAdapter.getSelectors().selectAll);
export const selectAllUsers = createSelector(selectAllUsersRaw, users => UserFilters.filterFunctions(users));

export const selectUsersForWorkspace = createSelector(selectAllUsers, selectAllGroups, selectOrganizationByWorkspace, (users, groups, organization) => {
  return UserFilters.filterByOrganization(users, organization)
    .map(user => mapGroupsOnUser(user, organization.id, groups));
});

function mapGroupsOnUser(user: UserModel, organizationId: string, groups: GroupModel[]) {
  const groupIds = user.groupsMap[organizationId];
  user.groups = groups.filter(group => groupIds.includes(group.id));
  return user;
}

