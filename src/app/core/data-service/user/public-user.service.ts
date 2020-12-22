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
import {UserService} from './user.service';
import {UserDto} from '../../dto';
import {generateId} from '../../../shared/utils/resource.utils';
import {InvitationType} from '../../model/invitation-type';
import {PaymentStats} from '../../store/organizations/payment/payment';
import {DefaultWorkspaceDto} from '../../dto/default-workspace.dto';
import {DEFAULT_USER} from '../../constants';
import {UserHintsDto} from '../../dto/user.dto';

@Injectable()
export class PublicUserService implements UserService {
  public createUser(organizationId: string, user: UserDto): Observable<UserDto> {
    return of({...user, id: generateId()});
  }

  public createUserInWorkspace(
    organizationId: string,
    projectId: string,
    users: UserDto[],
    invitationType?: InvitationType
  ): Observable<UserDto[]> {
    return of(users.map(user => ({...user, id: generateId()})));
  }

  public updateUser(organizationId: string, id: string, user: UserDto): Observable<UserDto> {
    return of(user);
  }

  public deleteUser(organizationId: string, id: string): Observable<string> {
    return of(id);
  }

  public getUsers(organizationId: string): Observable<UserDto[]> {
    return of([]);
  }

  public getCurrentUser(): Observable<UserDto> {
    return of({
      agreement: true,
      agreementDate: new Date().getTime(),
      email: DEFAULT_USER,
      id: DEFAULT_USER,
      emailVerified: true,
      name: 'Alan Turing',
      wizardDismissed: true,
      affiliatePartner: false,
      groups: {},
      lastLoggedIn: new Date().getTime(),
    });
  }

  public resendVerificationEmail(): Observable<any> {
    return of(true);
  }

  public getUserReferrals(): Observable<PaymentStats> {
    return of({commissions: [], paidCommissions: [], registeredUsers: 0});
  }

  public checkAuthentication(): Observable<any> {
    return of(true);
  }

  public getCurrentUserWithLastLogin(): Observable<UserDto> {
    return this.getCurrentUser();
  }

  public patchCurrentUser(user: Partial<UserDto>): Observable<UserDto> {
    return this.getCurrentUser();
  }

  public saveDefaultWorkspace(defaultWorkspace: DefaultWorkspaceDto): Observable<any> {
    return of(true);
  }

  public sendFeedback(message: string): Observable<any> {
    return of(true);
  }

  public getHints(): Observable<UserHintsDto> {
    return of({});
  }

  public updateHints(hints: UserHintsDto): Observable<UserHintsDto> {
    return of({});
  }
}
