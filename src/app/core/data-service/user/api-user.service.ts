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

import {Observable} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {map} from 'rxjs/operators';
import {UserService} from './user.service';
import {UserDto} from '../../dto';
import {InvitationType} from '../../model/invitation-type';
import {DefaultWorkspaceDto} from '../../dto/default-workspace.dto';
import {PaymentStats} from '../../store/organizations/payment/payment';
import {FeedbackDto} from '../../dto/feedback.dto';
import {UserHintsDto} from '../../dto/user.dto';
import {ConfigurationService} from '../../../configuration/configuration.service';

@Injectable()
export class ApiUserService implements UserService {
  constructor(private httpClient: HttpClient, private configurationService: ConfigurationService) {}

  public createUser(organizationId: string, user: UserDto): Observable<UserDto> {
    return this.httpClient.post<UserDto>(this.organizationUsersApiPrefix(organizationId), user);
  }

  public createUserInWorkspace(
    organizationId: string,
    projectId: string,
    users: UserDto[],
    invitationType?: InvitationType
  ): Observable<UserDto[]> {
    return this.httpClient.post<UserDto[]>(
      `${this.organizationApiPrefix(organizationId)}projects/${projectId}/users/${
        invitationType || InvitationType.JoinOnly
      }`,
      users
    );
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

  private organizationApiPrefix(organizationId: string): string {
    return `${this.usersApiPrefix()}/organizations/${organizationId}/`;
  }

  private organizationUsersApiPrefix(organizationId: string, userId?: string): string {
    return `${this.organizationApiPrefix(organizationId)}users${userId ? `/${userId}` : ''}`;
  }

  public getCurrentUser(): Observable<UserDto> {
    return this.httpClient.get<UserDto>(`${this.usersApiPrefix()}/current`);
  }

  public resendVerificationEmail(): Observable<any> {
    return this.httpClient.get(`${this.usersApiPrefix()}/current/resend`);
  }

  public getUserReferrals(): Observable<PaymentStats> {
    return this.httpClient.get<PaymentStats>(`${this.usersApiPrefix()}/current/referrals`);
  }

  public checkAuthentication(): Observable<any> {
    return this.httpClient.get(`${this.usersApiPrefix()}/check`);
  }

  public getCurrentUserWithLastLogin(): Observable<UserDto> {
    return this.httpClient.get<UserDto>(`${this.usersApiPrefix()}/currentWithLastLogin`);
  }

  public patchCurrentUser(user: Partial<UserDto>): Observable<UserDto> {
    return this.httpClient.patch<UserDto>(`${this.usersApiPrefix()}/current`, user);
  }

  public saveDefaultWorkspace(defaultWorkspace: DefaultWorkspaceDto): Observable<any> {
    return this.httpClient.put(`${this.usersApiPrefix()}/workspace`, defaultWorkspace);
  }

  public sendFeedback(message: string): Observable<void> {
    const feedback: FeedbackDto = {message};
    return this.httpClient.post<void>(`${this.usersApiPrefix()}/feedback`, feedback);
  }

  public getHints(): Observable<UserHintsDto> {
    return this.httpClient.get<UserHintsDto>(`${this.usersApiPrefix()}/current/hints`);
  }

  public updateHints(hints: UserHintsDto): Observable<UserHintsDto> {
    return this.httpClient.put<UserHintsDto>(`${this.usersApiPrefix()}/current/hints`, hints);
  }

  private usersApiPrefix(): string {
    return `${this.configurationService.getConfiguration().apiUrl}/rest/users`;
  }
}
