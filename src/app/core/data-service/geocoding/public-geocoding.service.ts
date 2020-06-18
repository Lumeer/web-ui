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
import {GeocodingService} from './geocoding.service';
import {CoordinatesDto, LocationDto} from '../../dto/location.dto';

@Injectable({
  providedIn: 'root',
})
export class PublicGeocodingService implements GeocodingService {
  public findCoordinates(queries: string[]): Observable<Record<string, CoordinatesDto>> {
    return of({});
  }

  public findLocations(query: string, limit = 10): Observable<LocationDto[]> {
    return of([]);
  }

  public findLocationByCoordinates(coordinates: CoordinatesDto): Observable<LocationDto> {
    return of(null);
  }
}
