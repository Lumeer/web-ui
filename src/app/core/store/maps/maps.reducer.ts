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

import {AttributeIdsMap, DEFAULT_MAP_CONFIG, MapModel} from './map.model';
import {MapsAction, MapsActionType} from './maps.action';
import {initialMapsState, mapsAdapter, MapsState} from './maps.state';

export function mapsReducer(state: MapsState = initialMapsState, action: MapsAction.All): MapsState {
  switch (action.type) {
    case MapsActionType.CREATE_MAP:
      return createMap(state, action);
    case MapsActionType.DESTROY_MAP:
      return mapsAdapter.removeOne(action.payload.mapId, state);
    case MapsActionType.SELECT_ATTRIBUTE:
      return selectAttribute(state, action);
    case MapsActionType.CLEAR:
      return initialMapsState;
    default:
      return state;
  }
}

function createMap(state: MapsState, action: MapsAction.CreateMap): MapsState {
  const map: MapModel = {
    id: action.payload.mapId,
    config: {...DEFAULT_MAP_CONFIG, ...action.payload.config},
  };
  return mapsAdapter.addOne(map, state);
}

function selectAttribute(state: MapsState, action: MapsAction.SelectAttribute): MapsState {
  const {mapId, collectionId, index, attributeId} = action.payload;

  const map = state.entities[mapId];
  if (!map) {
    return state;
  }

  const oldAttributeIdsMap: AttributeIdsMap = (map.config && map.config.attributeIdsMap) || {};

  const attributeIds = [...(oldAttributeIdsMap[collectionId] || [])];
  if (attributeId) {
    attributeIds.splice(index, 1, attributeId);
  } else {
    attributeIds.splice(index, 1);
  }

  const attributeIdsMap: AttributeIdsMap = {...oldAttributeIdsMap, [collectionId]: attributeIds};
  const config = {...map.config, attributeIdsMap};

  return mapsAdapter.updateOne({id: mapId, changes: {config}}, state);
}
