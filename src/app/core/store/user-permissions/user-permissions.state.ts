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

import {AppState} from '../app.state';
import {createSelector} from '@ngrx/store';
import {AllowedPermissions, AllowedPermissionsMap} from '../../model/allowed-permissions';

export interface UserPermissionsState {
  organization?: AllowedPermissions;
  project?: AllowedPermissions;
  collections: AllowedPermissionsMap;
  linkTypes: AllowedPermissionsMap;
  views: AllowedPermissionsMap;
}

export const initialUserPermissionsState: UserPermissionsState = {
  collections: {},
  linkTypes: {},
  views: {},
};

export const selectUserPermissionsState = (state: AppState) => state.userPermissions;

export const selectOrganizationPermissions = createSelector(selectUserPermissionsState, state => state.organization);

export const selectProjectPermissions = createSelector(selectUserPermissionsState, state => state.project);

export const selectCollectionsPermissions = createSelector(selectUserPermissionsState, state => state.collections);

export const selectCollectionPermissions = (collectionId: string) =>
  createSelector(selectCollectionsPermissions, collections => collections?.[collectionId] || {});

export const selectLinkTypesPermissions = createSelector(selectUserPermissionsState, state => state.linkTypes);

export const selectLinkTypePermissions = (linkTypeId: string) =>
  createSelector(selectLinkTypesPermissions, linkTypes => linkTypes?.[linkTypeId] || {});

export const selectResourcesPermissions = createSelector(
  selectCollectionsPermissions,
  selectLinkTypesPermissions,
  (collections, linkTypes) => ({collections, linkTypes})
);

export const selectViewsPermissions = createSelector(selectUserPermissionsState, state => state.views);

export const selectViewPermissions = (viewId: string) =>
  createSelector(selectViewsPermissions, views => views?.[viewId]);
