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

import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {AddressCoordinatesMap} from '../address-coordinates-map';
import {MapQuestGeocodingApiService} from './mapquest-geocoding-api.service';

@Injectable({
  providedIn: 'root',
})
export class MapQuestWrapperService {
  constructor(private mapQuestGeocodingApiService: MapQuestGeocodingApiService) {}

  public getCoordinatesFromAddresses(addresses: string[]): Observable<AddressCoordinatesMap> {
    // TODO split requests in case of more than 100 addresses
    return this.mapQuestGeocodingApiService.getBatchGeocode(addresses).pipe(
      map(response =>
        addresses.reduce((coordinatesMap, address) => {
          const result = response.results.find(res => res.providedLocation.location === address);
          if (!result) {
            return {...coordinatesMap, [address]: null};
          }

          return {...coordinatesMap, [address]: result.locations && result.locations[0] && result.locations[0].latLng};
        }, {})
      ),
      catchError(error => of({}))
    );
  }
}
