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

import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {GeoCodingApiService} from '../rest/geocoding-api.service';
import {MapCoordinates} from '../store/maps/map.model';
import {Address} from './address';
import {GeoLocationsMap} from './geo-location';
import {convertGeoCodingResultToGeoLocations} from './geocoding.utils';

@Injectable({
  providedIn: 'root',
})
export class GeoCodingService {
  private geoLocationsCache: GeoLocationsMap = {};

  constructor(private geoCodingApiService: GeoCodingApiService) {}

  public convertAddressesToCoordinates(addresses: string[]): Observable<Record<string, MapCoordinates>> {
    return this.updateGeoLocationCache(addresses).pipe(
      map(geoLocationsMap =>
        addresses.reduce((coordinatesMap, address) => {
          const geoLocations = geoLocationsMap[address];
          if (geoLocations && geoLocations.length > 0) {
            coordinatesMap[address] = geoLocations[0].coordinates;
          }
          return coordinatesMap;
        }, {})
      )
    );
  }

  public suggestAddressesForQuery(query: string): Observable<Address[]> {
    return this.updateGeoLocationCache([query]).pipe(
      map(geoLocationsMap => (geoLocationsMap[query] || []).map(geoLocation => geoLocation.address))
    );
  }

  private updateGeoLocationCache(queries: string[]): Observable<GeoLocationsMap> {
    const newQueries = queries.filter(address => !this.geoLocationsCache[address]);

    if (newQueries.length === 0) {
      return of(this.geoLocationsCache);
    }

    return this.getMissingGeoLocations(newQueries).pipe(
      map(geoLocationMap => {
        this.geoLocationsCache = {...this.geoLocationsCache, ...geoLocationMap};
        return this.geoLocationsCache;
      })
    );
  }

  private getMissingGeoLocations(queries: string[]): Observable<GeoLocationsMap> {
    return this.geoCodingApiService.getResults(queries).pipe(
      map(results =>
        results.reduce<GeoLocationsMap>((geoLocations, result) => {
          geoLocations[result.query] = convertGeoCodingResultToGeoLocations(result);
          return geoLocations;
        }, {})
      )
    );
  }
}
