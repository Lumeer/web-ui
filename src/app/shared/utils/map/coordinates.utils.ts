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

import * as Coordinates from 'coordinate-parser';
import {CoordinatesFormat} from '../../../core/model/data/constraint-config';
import {MapCoordinates} from '../../../core/store/maps/map.model';
import {isNotNullOrUndefined, isNumeric} from '../common.utils';

export function parseCoordinates(value: any): MapCoordinates {
  if (value && isNotNullOrUndefined(value.lat) && isNotNullOrUndefined(value.lng)) {
    return value as MapCoordinates;
  }

  const mappedValue = isNumeric(value) && !String(value).includes(',') ? `${value},0` : value;
  try {
    const coordinates = new Coordinates(mappedValue);
    return {
      lat: coordinates.getLatitude(),
      lng: coordinates.getLongitude(),
    };
  } catch (error) {
    return null;
  }
}

export function formatCoordinates(coordinates: MapCoordinates, format: CoordinatesFormat, precision: number): string {
  const safePrecision = precision && precision >= 0 && precision <= 20 ? precision : 0;
  if (format === CoordinatesFormat.DegreesMinutesSeconds) {
    return formatCoordinatesToDegreesMinutesSeconds(coordinates, safePrecision);
  }
  return formatCoordinatesToDecimalDegrees(coordinates, safePrecision);
}

function formatCoordinatesToDecimalDegrees(coordinates: MapCoordinates, precision: number): string {
  return formatStringCoordinates(coordinates.lng.toFixed(precision), coordinates.lat.toFixed(precision));
}

function formatCoordinatesToDegreesMinutesSeconds(coordinates: MapCoordinates, precision: number): string {
  const longitude = formatNumberCoordinate(coordinates.lng, precision) + (coordinates.lng > 0 ? 'E' : 'W');
  const latitude = formatNumberCoordinate(coordinates.lat, precision) + (coordinates.lat > 0 ? 'N' : 'S');
  return formatStringCoordinates(longitude, latitude);
}

function formatNumberCoordinate(coordinate: number, precision: number): string {
  let value = Math.abs(coordinate);

  const degrees = Math.floor(value);

  value -= degrees;
  value *= 60;

  const minutes = Math.floor(value);
  const seconds = (value - minutes) * 60;

  return degrees.toFixed(0) + `° ` + minutes.toFixed(0) + `' ` + seconds.toFixed(precision) + `" `;
}

function formatStringCoordinates(longitude: string, latitude: string): string {
  return `${latitude}, ${longitude}`;
}
