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

import {HttpClient, HttpParams} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {environment} from '../../../../../environments/environment';
import {MapQuestResponse} from './mapquest-response.dto';

const MAPQUEST_API_URL = 'https://www.mapquestapi.com/geocoding/v1/';

@Injectable({
  providedIn: 'root'
})
export class MapQuestGeocodingApiService {

  constructor(private httpClient: HttpClient) {
  }

  public getBatchGeocode(addresses: string[]): Observable<MapQuestResponse> {
    const keyParams = new HttpParams().append('key', environment.mapQuestKey);
    const params = addresses.reduce((addressParams, address) => addressParams.append('location', address), keyParams);

    return this.httpClient.get<MapQuestResponse>(`${MAPQUEST_API_URL}batch`, {params});
  }

}
