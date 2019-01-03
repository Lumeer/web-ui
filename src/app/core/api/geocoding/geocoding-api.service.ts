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
import {map} from 'rxjs/operators';
import {MapCoordinates} from '../../store/maps/map.model';
import {AddressCoordinatesMap} from './address-coordinates-map';
import {MapQuestWrapperService} from './mapquest/mapquest-wrapper.service';

@Injectable({
  providedIn: 'root',
})
export class GeocodingApiService {
  private coordinatesCache: AddressCoordinatesMap = {};

  // TODO use other geocoding providers and switch dynamically between them
  constructor(private mapQuestWrapperService: MapQuestWrapperService) {}

  public convertAddressesToCoordinates(addresses: string[]): Observable<AddressCoordinatesMap> {
    const newAddresses = addresses.filter(address => this.coordinatesCache[address] === undefined);

    if (newAddresses.length === 0) {
      return of(this.coordinatesCache);
    }

    return this.mapQuestWrapperService.getCoordinatesFromAddresses(addresses).pipe(
      map(coordinatesMap => {
        this.coordinatesCache = {...this.coordinatesCache, ...coordinatesMap};
        return this.coordinatesCache;
      })
    );
  }

  public convertCoordinatesToAddress(coordinates: MapCoordinates): Observable<string> {
    // TODO
    return of('');
  }
}
