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

import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {UserDto} from '../dto';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {DefaultWorkspace} from '../dto/default-workspace';
import {FeedbackDto} from '../dto/feedback.dto';

@Injectable()
export class UserService {
  constructor(private httpClient: HttpClient) {}

  public createUser(organizationId: string, user: UserDto): Observable<UserDto> {
    return this.httpClient.post<UserDto>(this.organizationUsersApiPrefix(organizationId), user);
  }

  public updateUser(organizationId: string, id: string, user: UserDto): Observable<UserDto> {
    return this.httpClient.put<UserDto>(this.organizationUsersApiPrefix(organizationId, user.id), user);
  }

  public deleteUser(organizationId: string, id: string): Observable<string> {
    return this.httpClient
      .delete(this.organizationUsersApiPrefix(organizationId, id), {observe: 'response', responseType: 'text'})
      .pipe(map(() => id));
  }

  public getUsers(organizationId: string): Observable<UserDto[]> {
    return this.httpClient.get<UserDto[]>(this.organizationUsersApiPrefix(organizationId));
  }

  private organizationUsersApiPrefix(organizationId: string, userId?: string): string {
    return `${this.usersApiPrefix()}/organizations/${organizationId}/users${userId ? `/${userId}` : ''}`;
  }

  public getCurrentUser(): Observable<UserDto> {
    return this.httpClient.get<UserDto>(`${this.usersApiPrefix()}/current`);
  }

  public patchCurrentUser(user: Partial<UserDto>): Observable<UserDto> {
    return this.httpClient.patch<UserDto>(`${this.usersApiPrefix()}/current`, user);
  }

  public saveDefaultWorkspace(defaultWorkspace: DefaultWorkspace): Observable<any> {
    return this.httpClient.put(`${this.usersApiPrefix()}/workspace`, defaultWorkspace);
  }

  public sendFeedback(message: string): Observable<void> {
    const feedback: FeedbackDto = {message};
    return this.httpClient.post<void>(`${this.usersApiPrefix()}/feedback`, feedback);
  }

  private usersApiPrefix(): string {
    return `${environment.apiUrl}/rest/users`;
  }
}
