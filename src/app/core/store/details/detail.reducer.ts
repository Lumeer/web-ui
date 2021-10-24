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

import {createReducer, on} from '@ngrx/store';
import * as DetailActions from './detail.actions';
import {detailsAdapter, DetailsState, initialDetailsState} from './detail.state';
import {QueryStem} from '../navigation/query/query';
import {AttributesSettings} from '../views/view';
import {areQueryStemsEqual} from '../navigation/query/query.helper';
import {uniqueValues} from '../../../shared/utils/array.utils';
import {DetailConfig} from './detail';

export const detailsReducer = createReducer(
  initialDetailsState,
  on(DetailActions.add, (state, action) => detailsAdapter.upsertOne(action.detail, state)),
  on(DetailActions.remove, (state, action) => detailsAdapter.removeOne(action.detailId, state)),
  on(DetailActions.setStemAttributes, (state, action) =>
    setStemAttributes(state, action.detailId, action.stem, action.attributes)
  ),
  on(DetailActions.addCollapsedLink, (state, action) =>
    addCollapsed(state, action.detailId, action.linkTypeId, 'collapsedLinkTypes')
  ),
  on(DetailActions.removeCollapsedLink, (state, action) =>
    removeCollapsed(state, action.detailId, action.linkTypeId, 'collapsedLinkTypes')
  ),
  on(DetailActions.addCollapsedCollection, (state, action) =>
    addCollapsed(state, action.detailId, action.collectionId, 'collapsedCollections')
  ),
  on(DetailActions.removeCollapsedCollection, (state, action) =>
    removeCollapsed(state, action.detailId, action.collectionId, 'collapsedCollections')
  ),
  on(DetailActions.setConfig, (state, action) =>
    detailsAdapter.updateOne({id: action.detailId, changes: {config: action.config}}, state)
  ),
  on(DetailActions.clear, state => detailsAdapter.removeAll(state))
);

function setStemAttributes(
  state: DetailsState,
  detailId: string,
  stem: QueryStem,
  attributesSettings: AttributesSettings
) {
  const detail = state.entities[detailId];
  if (detail) {
    const stemsConfigs = [...(detail.config.stemsConfigs || [])];
    const stemConfigIndex = stemsConfigs.findIndex(stemConfig => areQueryStemsEqual(stemConfig.stem, stem));
    if (stemConfigIndex !== -1) {
      stemsConfigs[stemConfigIndex] = {...stemsConfigs[stemConfigIndex], attributesSettings};
      return detailsAdapter.updateOne({id: detailId, changes: {config: {...detail.config, stemsConfigs}}}, state);
    } else {
      stemsConfigs.push({stem, attributesSettings});
      return detailsAdapter.upsertOne({id: detailId, config: {stemsConfigs}}, state);
    }
  }

  return state;
}

function addCollapsed(state: DetailsState, detailId: string, objectId: string, param: keyof DetailConfig) {
  const detail = state.entities[detailId];
  if (detail) {
    const collapsedIds = [...(detail.config?.[param] || [])];
    collapsedIds.push(objectId);
    return detailsAdapter.updateOne(
      {id: detailId, changes: {config: {...detail.config, [param]: uniqueValues(collapsedIds)}}},
      state
    );
  }

  return state;
}

function removeCollapsed(state: DetailsState, detailId: string, objectId: string, param: keyof DetailConfig) {
  const detail = state.entities[detailId];
  if (detail) {
    const collapsedIds = [...(detail.config?.[param] || [])].filter(collapsedId => collapsedId !== objectId);
    return detailsAdapter.updateOne(
      {
        id: detailId,
        changes: {config: {...detail.config, [param]: collapsedIds}},
      },
      state
    );
  }

  return state;
}
