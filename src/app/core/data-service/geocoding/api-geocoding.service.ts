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

import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {GeocodingService} from './geocoding.service';
import {environment} from '../../../../environments/environment';
import {CoordinatesDto, LocationDto} from '../../dto/location.dto';

const GEOCODING_URL = `${environment.apiUrl}/rest/geocoding`;

@Injectable({
  providedIn: 'root',
})
export class ApiGeocodingService implements GeocodingService {
  constructor(private http: HttpClient) {}

  public findCoordinates(queries: string[]): Observable<Record<string, CoordinatesDto>> {
    return this.http.get<Record<string, CoordinatesDto>>(`${GEOCODING_URL}/coordinates`, {
      params: {
        query: queries,
      },
    });
  }

  public findLocations(query: string, limit = 10): Observable<LocationDto[]> {
    return this.http.get<LocationDto[]>(`${GEOCODING_URL}/locations`, {
      params: {
        query,
        limit: String(limit),
        lang: environment.locale,
      },
    });
  }

  public findLocationByCoordinates(coordinates: CoordinatesDto): Observable<LocationDto> {
    return this.http.get<LocationDto>(`${GEOCODING_URL}/locations/${coordinates.lat},${coordinates.lng}`, {
      params: {
        lang: environment.locale,
      },
    });
  }
}
