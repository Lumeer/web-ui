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
import {Team} from './team';
import {selectOrganizationByWorkspace} from '../organizations/organizations.state';

export interface TeamsState extends EntityState<Team> {
  loaded: {[organizationId: string]: boolean};
}

export const teamsAdapter = createEntityAdapter<Team>();

export const initialTeamsState: TeamsState = teamsAdapter.getInitialState({
  loaded: {},
});

export const selectTeamsState = (state: AppState) => state.teams;

export const selectAllTeams = createSelector(selectTeamsState, teamsAdapter.getSelectors().selectAll);

export const selectTeamsDictionary = createSelector(selectTeamsState, teamsAdapter.getSelectors().selectEntities);

export const selectTeamsByOrganization = id =>
  createSelector(selectAllTeams, teams => teams.filter(team => team.organizationId === id));

export const selectTeamsForWorkspace = createSelector(
  selectAllTeams,
  selectOrganizationByWorkspace,
  (teams, organization) => (organization && teams.filter(group => group.organizationId === organization.id)) || []
);

export const selectTeamsLoadedForOrganization = id =>
  createSelector(selectTeamsState, teamsState => teamsState.loaded?.[id]);
