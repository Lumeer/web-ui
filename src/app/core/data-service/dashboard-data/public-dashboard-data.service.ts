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

import {DashboardDataService} from './dashboard-data.service';
import {BaseService} from '../../rest/base.service';
import {Observable, of} from 'rxjs';
import {DashboardDataDto} from '../../dto/dashboard-data.dto';

@Injectable()
export class PublicDashboardDataService extends BaseService implements DashboardDataService {
  public deleteByType(type: string, ids: string[]): Observable<any> {
    return of(true);
  }

  public getAll(): Observable<DashboardDataDto[]> {
    return of([]);
  }

  public update(data: DashboardDataDto): Observable<DashboardDataDto> {
    return of(data);
  }

  public getOne(type: string, id: string): Observable<DashboardDataDto> {
    return of({type, typeId: id});
  }
}
