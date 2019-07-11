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

import {Action} from '@ngrx/store';
import {MapCoordinates} from '../maps/map.model';
import {GeoLocation} from './geo-location';

export enum GeocodingActionType {
  GET_COORDINATES = '[Geocoding] Get Coordinates',
  GET_COORDINATES_SUCCESS = '[Geocoding] Get Coordinates :: Success',

  GET_LOCATIONS = '[Geocoding] Get Locations',
  GET_LOCATIONS_SUCCESS = '[Geocoding] Get Locations :: Success',

  GET_LOCATION = '[Geocoding] Get Location',
  GET_LOCATION_SUCCESS = '[Geocoding] Get Location :: Success',

  CLEAR = '[Geocoding] Clear',
}

export namespace GeocodingAction {
  export class GetCoordinates implements Action {
    public readonly type = GeocodingActionType.GET_COORDINATES;

    public constructor(public payload: {queries: string[]}) {}
  }

  export class GetCoordinatesSuccess implements Action {
    public readonly type = GeocodingActionType.GET_COORDINATES_SUCCESS;

    public constructor(public payload: {coordinatesMap: Record<string, MapCoordinates>}) {}
  }

  export class GetLocations implements Action {
    public readonly type = GeocodingActionType.GET_LOCATIONS;

    public constructor(public payload: {query: string}) {}
  }

  export class GetLocationsSuccess implements Action {
    public readonly type = GeocodingActionType.GET_LOCATIONS_SUCCESS;

    public constructor(public payload: {query: string; locations: GeoLocation[]}) {}
  }

  export class GetLocation implements Action {
    public readonly type = GeocodingActionType.GET_LOCATION;

    public constructor(
      public payload: {
        coordinates: MapCoordinates;
        onSuccess: (location: GeoLocation) => void;
        onFailure?: (error: any) => void;
      }
    ) {}
  }

  export class GetLocationSuccess implements Action {
    public readonly type = GeocodingActionType.GET_LOCATION_SUCCESS;

    public constructor(public payload: {coordinates: MapCoordinates; location: GeoLocation}) {}
  }

  export class Clear implements Action {
    public readonly type = GeocodingActionType.CLEAR;
  }

  export type All =
    | GetCoordinates
    | GetCoordinatesSuccess
    | GetLocations
    | GetLocationsSuccess
    | GetLocation
    | GetLocationSuccess
    | Clear;
}
