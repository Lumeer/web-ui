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
import 'rxjs/add/observable/of';

import {Observable} from 'rxjs/Observable';
import {User} from '../dto';
import {HttpClient} from "@angular/common/http";
import {map} from "rxjs/operators";

@Injectable()
export class UserService {

  constructor(private httpClient: HttpClient) {
  }

  public createUser(organizationId: string, user: User): Observable<User> {
    return this.httpClient.post<User>(this.apiPrefix(organizationId), user);
  }

  public updateUser(organizationId: string, id: string, user: User): Observable<User> {
    return this.httpClient.put<User>(this.apiPrefix(organizationId, user.id), user);
  }

  public deleteUser(organizationId: string, id: string): Observable<string> {
    return this.httpClient.delete(this.apiPrefix(organizationId, id), {observe: 'response', responseType: 'text'})
      .pipe(map(() => id));
  }

  public getUsers(organizationId: string): Observable<User[]> {
    return this.httpClient.get<User[]>(this.apiPrefix(organizationId));
  }

  private apiPrefix(organizationId: string, userId?: string): string {
    return `/${API_URL}/rest/organizations/${organizationId}/users${userId ? `/${userId}` : ''}`;
  }

}
