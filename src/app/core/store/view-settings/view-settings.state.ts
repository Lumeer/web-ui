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
import {createSelector} from '@ngrx/store';

import {AppState} from '../app.state';
import {selectCollectionsDictionary} from '../collections/collections.state';
import {selectLinkTypesDictionary} from '../link-types/link-types.state';
import {selectWorkspace} from '../navigation/navigation.state';
import {createSaveViewSettings, viewSettingsChanged} from '../views/view.utils';
import {selectCurrentView, selectViewQuery} from '../views/views.state';
import {ViewSettings} from './view-settings';
import {viewSettingsIdByView, viewSettingsIdByWorkspace} from './view-settings.util';

export interface ViewSettingsState extends Record<string, ViewSettings> {}

export const initialViewSettingsState: ViewSettingsState = {};

export const selectViewSettingsState = (state: AppState) => state.viewSettings;

export const selectViewSettingsId = createSelector(selectWorkspace, workspace => viewSettingsIdByWorkspace(workspace));

export const selectViewSettings = createSelector(
  selectViewSettingsState,
  selectViewSettingsId,
  (state, id) => state[id]
);

export const selectViewSettingsById = id => createSelector(selectViewSettingsState, state => state[id]);

export const selectViewSettingsByView = view =>
  createSelector(selectViewSettingsState, state => state[viewSettingsIdByView(view)]);

export const selectSaveViewSettings = createSelector(
  selectViewSettings,
  selectCollectionsDictionary,
  selectLinkTypesDictionary,
  selectViewQuery,
  (settings, collectionsMap, linkTypesMap, query) =>
    createSaveViewSettings(settings, query, collectionsMap, linkTypesMap)
);

export const selectViewSettingsChanged = createSelector(
  selectCurrentView,
  selectViewSettings,
  selectCollectionsDictionary,
  selectLinkTypesDictionary,
  (view, settings, collectionsMap, linkTypesMap) =>
    view && viewSettingsChanged(view.settings, settings, collectionsMap, linkTypesMap)
);

export const selectViewSettingsCollectionPermissions = (collectionId: string) =>
  createSelector(selectViewSettings, settings => settings?.permissions?.collections?.[collectionId]);

export const selectViewSettingsLinkTypePermissions = (linkTypeId: string) =>
  createSelector(selectViewSettings, settings => settings?.permissions?.linkTypes?.[linkTypeId]);

export const selectDataSettingsIncludeSubItems = createSelector(
  selectViewSettings,
  settings => settings?.data?.includeSubItems
);

export const selectViewDataQuery = createSelector(
  selectDataSettingsIncludeSubItems,
  selectViewQuery,
  (includeSubItems, viewQuery) => viewQuery && {...viewQuery, includeSubItems}
);
