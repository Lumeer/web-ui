/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Lumeer.io, s.r.o. and/or its affiliates.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General abstract License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General abstract License for more details.
 *
 * You should have received a copy of the GNU General abstract License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

import {Observable} from 'rxjs';
import {UserDto} from '../../dto';
import {InvitationType} from '../../model/invitation-type';
import {PaymentStats} from '../../store/organizations/payment/payment';
import {DefaultWorkspaceDto} from '../../dto/default-workspace.dto';

export abstract class UserService {

  abstract createUser(organizationId: string, user: UserDto): Observable<UserDto>;

  abstract createUserInWorkspace(
    organizationId: string,
    projectId: string,
    users: UserDto[],
    invitationType?: InvitationType
  ): Observable<UserDto[]>;

  abstract updateUser(organizationId: string, id: string, user: UserDto): Observable<UserDto>;

  abstract deleteUser(organizationId: string, id: string): Observable<string>;

  abstract getUsers(organizationId: string): Observable<UserDto[]>;

  abstract getCurrentUser(): Observable<UserDto>;

  abstract resendVerificationEmail(): Observable<any>;

  abstract getUserReferrals(): Observable<PaymentStats>;

  abstract checkAuthentication(): Observable<any>;

  abstract getCurrentUserWithLastLogin(): Observable<UserDto>;

  abstract patchCurrentUser(user: Partial<UserDto>): Observable<UserDto>;

  abstract saveDefaultWorkspace(defaultWorkspace: DefaultWorkspaceDto): Observable<any>;

  abstract sendFeedback(message: string): Observable<any>;
}
