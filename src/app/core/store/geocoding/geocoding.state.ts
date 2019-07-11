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
import {formatMapCoordinates} from '../maps/map-coordinates';
import {MapCoordinates} from '../maps/map.model';
import {GeoLocation} from './geo-location';

export interface GeocodingState {
  queryCoordinates: Record<string, MapCoordinates>;
  queryLocations: Record<string, GeoLocation[]>;
  coordinatesLocation: Record<string, GeoLocation>;
}

export const initialGeocodingState: GeocodingState = {
  queryCoordinates: {},
  queryLocations: {},
  coordinatesLocation: {},
};

export const selectGeocodingState = (state: AppState) => state.geocoding;

export const selectGeocodingQueryCoordinates = createSelector(
  selectGeocodingState,
  state => state.queryCoordinates
);

export const selectGeocodingQueryLocations = createSelector(
  selectGeocodingState,
  state => state.queryLocations
);
export const selectLocationsByQuery = (query: string) =>
  createSelector(
    selectGeocodingQueryLocations,
    queryLocations => queryLocations[query]
  );

export const selectGeocodingCoordinatesLocation = createSelector(
  selectGeocodingState,
  state => state.coordinatesLocation
);
export const selectLocationByCoordinates = (coordinates: MapCoordinates) =>
  createSelector(
    selectGeocodingCoordinatesLocation,
    coordinatesLocation => coordinatesLocation[formatMapCoordinates(coordinates)]
  );
