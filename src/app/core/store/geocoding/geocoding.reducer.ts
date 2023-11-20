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
import {formatMapCoordinates} from '../maps/map-coordinates';
import {GeocodingAction, GeocodingActionType} from './geocoding.action';
import {GeocodingState, initialGeocodingState} from './geocoding.state';

export function geocodingReducer(
  state: GeocodingState = initialGeocodingState,
  action: GeocodingAction.All
): GeocodingState {
  switch (action.type) {
    case GeocodingActionType.GET_COORDINATES_SUCCESS:
      return getCoordinates(state, action);
    case GeocodingActionType.GET_LOCATION_SUCCESS:
      return getLocation(state, action);
    case GeocodingActionType.GET_LOCATIONS_SUCCESS:
      return getLocations(state, action);
    case GeocodingActionType.CLEAR:
      return initialGeocodingState;
    default:
      return state;
  }
}

function getCoordinates(state: GeocodingState, action: GeocodingAction.GetCoordinatesSuccess): GeocodingState {
  const queryCoordinates = {...state.queryCoordinates, ...action.payload.coordinatesMap};
  return {...state, queryCoordinates};
}

function getLocation(state: GeocodingState, action: GeocodingAction.GetLocationSuccess): GeocodingState {
  const {coordinates, location} = action.payload;
  const coordinatesString = formatMapCoordinates(coordinates);

  const coordinatesLocation = {...state.coordinatesLocation, [coordinatesString]: location};
  return {...state, coordinatesLocation};
}

function getLocations(state: GeocodingState, action: GeocodingAction.GetLocationsSuccess): GeocodingState {
  const {query, locations} = action.payload;

  const queryLocations = {...state.queryLocations, [query]: locations};
  return {...state, queryLocations};
}
