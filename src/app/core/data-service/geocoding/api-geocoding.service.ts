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
import {CoordinatesDto, LocationDto} from '../../dto/location.dto';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable({
  providedIn: 'root',
})
export class ApiGeocodingService implements GeocodingService {
  private readonly geocodingUrl: string;

  constructor(private http: HttpClient, private configurationService: ConfigurationService) {
    this.geocodingUrl = `${this.configurationService.getConfiguration().apiUrl}/rest/geocoding`;
  }

  public findCoordinates(queries: string[]): Observable<Record<string, CoordinatesDto>> {
    return this.http.get<Record<string, CoordinatesDto>>(`${this.geocodingUrl}/coordinates`, {
      params: {
        query: queries,
      },
    });
  }

  public findLocations(query: string, limit = 10): Observable<LocationDto[]> {
    return this.http.get<LocationDto[]>(`${this.geocodingUrl}/locations`, {
      params: {
        query,
        limit: String(limit),
      },
    });
  }

  public findLocationByCoordinates(coordinates: CoordinatesDto): Observable<LocationDto> {
    return this.http.get<LocationDto>(`${this.geocodingUrl}/locations/${coordinates.lat},${coordinates.lng}`);
  }
}
