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

import {Observable} from 'rxjs/Observable';
import {User} from '../dto';
import {HttpClient} from "@angular/common/http";
import 'rxjs/add/observable/of';
import {DefaultWorkspace} from '../dto/default-workspace';

@Injectable()
export class GlobalService {

  constructor(private httpClient: HttpClient) {
  }

  public getCurrentUser(): Observable<User> {
    return this.httpClient.get<User>(`${this.apiPrefix()}/currentUser`);
  }

  public saveDefaultWorkspace(defaultWorkspace: DefaultWorkspace): Observable<any> {
    return this.httpClient.put(`${this.apiPrefix()}/workspace`, defaultWorkspace);
  }

  private apiPrefix(): string {
    return `/${API_URL}/rest/global`;
  }

}
