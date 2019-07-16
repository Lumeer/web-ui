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

import {MapCoordinates} from './map.model';

export function formatMapCoordinates(coordinates: MapCoordinates): string {
  const latitude = coordinates.lat.toFixed(6);
  const longitude = coordinates.lng.toFixed(6);
  return `${latitude},${longitude}`;
}

export function parseMapCoordinates(coordinates: string): MapCoordinates {
  const [lat, lng] = (coordinates || '').split(',', 2);
  if (!lat || !lng) {
    return null;
  }

  return {lat: Number(lat), lng: Number(lng)};
}
