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
import {DEFAULT_MAP_CONFIG, MapModel} from './map.model';
import {MapsAction, MapsActionType} from './maps.action';
import {MapsState, initialMapsState, mapsAdapter} from './maps.state';

export function mapsReducer(state: MapsState = initialMapsState, action: MapsAction.All): MapsState {
  switch (action.type) {
    case MapsActionType.CREATE_MAP:
      return createMap(state, action);
    case MapsActionType.DESTROY_MAP:
      return mapsAdapter.removeOne(action.payload.mapId, state);
    case MapsActionType.SET_CONFIG:
      return mapsAdapter.updateOne({id: action.payload.mapId, changes: {config: action.payload.config}}, state);
    case MapsActionType.CHANGE_POSITION:
      return changePosition(state, action);
    case MapsActionType.CHANGE_POSITION_SAVED:
      return changePositionSaved(state, action);
    case MapsActionType.DOWNLOAD_IMAGE_DATA_SUCCESS:
      return {...state, imagesCache: {...state.imagesCache, [action.payload.url]: action.payload.data}};
    case MapsActionType.SET_IMAGE_DATA_LOADING:
      return setImageDataLoading(state, action);
    case MapsActionType.SET_IMAGE_DATA_LOADED:
      return {...state, imagesLoaded: {...state.imagesLoaded, [action.payload.url]: action.payload.result}};
    case MapsActionType.CLEAR:
      return initialMapsState;
    default:
      return state;
  }
}

function createMap(state: MapsState, action: MapsAction.CreateMap): MapsState {
  const {mapId, config} = action.payload;

  const map: MapModel = {
    id: mapId,
    config: {...DEFAULT_MAP_CONFIG, ...config},
  };
  return mapsAdapter.upsertOne(map, state);
}

function changePosition(state: MapsState, action: MapsAction.ChangePosition): MapsState {
  const {mapId, position} = action.payload;

  const map = state.entities[mapId];
  if (!map) {
    return state;
  }

  const config = {...map.config, position};
  return mapsAdapter.updateOne({id: mapId, changes: {config}}, state);
}

function changePositionSaved(state: MapsState, action: MapsAction.ChangePositionSaved): MapsState {
  const {mapId, positionSaved} = action.payload;

  const map = state.entities[mapId];
  if (!map) {
    return state;
  }

  const config = {...map.config, positionSaved};
  return mapsAdapter.updateOne({id: mapId, changes: {config}}, state);
}

function setImageDataLoading(state: MapsState, action: MapsAction.SetImageDataLoading): MapsState {
  let imagesLoading = [...state.imagesLoading];
  if (action.payload.loading) {
    imagesLoading.push(action.payload.url);
  } else {
    imagesLoading = imagesLoading.filter(url => url !== action.payload.url);
  }
  return {...state, imagesLoading};
}
