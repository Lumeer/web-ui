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

import {MapQuestLocation} from '../dto/external/mapquest-response.dto';
import {GeoCodingProvider, GeocodingResultDto} from '../dto/geocoding-result.dto';
import {Address} from './address';
import {GeoLocation} from './geo-location';

export function convertGeoCodingResultToGeoLocations(result: GeocodingResultDto): GeoLocation[] {
  if (!result) {
    return [];
  }

  switch (result.provider) {
    case GeoCodingProvider.MapQuest:
      return convertMapQuestGeoCodingResults(result.results);
    default:
      return [];
  }
}

function convertMapQuestGeoCodingResults(results: MapQuestLocation[]): GeoLocation[] {
  return results
    ? results.map(result => ({
        address: convertMapQuestLocationToAddress(result),
        coordinates: result && result.latLng,
      }))
    : [];
}

function convertMapQuestLocationToAddress(result: MapQuestLocation): Address {
  return (
    result && {
      street: result.street,
      zip: result.postalCode,
      city: findMapQuestAdminAreaValue(result, 'City'),
      county: findMapQuestAdminAreaValue(result, 'County'),
      state: findMapQuestAdminAreaValue(result, 'State'),
      country: findMapQuestAdminAreaValue(result, 'Country'),
    }
  );
}

function findMapQuestAdminAreaValue(result: MapQuestLocation, type: string): string {
  const [typeField] = Object.entries(result).find(
    ([key, value]) => key.startsWith('adminArea') && key.endsWith('Type') && value === type
  );
  if (!typeField) {
    return '';
  }

  return result[typeField.slice(0, -4)];
}
