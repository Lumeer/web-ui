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

export const detailsReducer = createReducer(
  initialDetailsState,
  on(DetailActions.add, (state, action) => detailsAdapter.upsertOne(action.detail, state)),
  on(DetailActions.remove, (state, action) => detailsAdapter.removeOne(action.detailId, state)),
  on(DetailActions.addHiddenLink, (state, action) => addHiddenLink(state, action.detailId, action.linkTypeId)),
  on(DetailActions.removeHiddenLink, (state, action) => removeHiddenLink(state, action.detailId, action.linkTypeId)),
  on(DetailActions.setConfig, (state, action) =>
    detailsAdapter.updateOne({id: action.detailId, changes: {config: action.config}}, state)
  ),
  on(DetailActions.clear, state => detailsAdapter.removeAll(state))
);

function addHiddenLink(state: DetailsState, detailId: string, linkTypeId: string) {
  const detail = state.entities[detailId];
  if (detail) {
    const hiddenLinkTypes = [...(detail.config?.hiddenLinkTypes || [])];
    hiddenLinkTypes.push(linkTypeId);
    return detailsAdapter.updateOne({id: detailId, changes: {config: {hiddenLinkTypes}}}, state);
  }

  return state;
}

function removeHiddenLink(state: DetailsState, detailId: string, linkTypeId: string) {
  const detail = state.entities[detailId];
  if (detail) {
    const hiddenLinkTypes = (detail.config?.hiddenLinkTypes || []).filter(
      hiddenLinkType => hiddenLinkType !== linkTypeId
    );
    return detailsAdapter.updateOne({id: detailId, changes: {config: {hiddenLinkTypes}}}, state);
  }

  return state;
}
