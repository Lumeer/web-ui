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

import {Observable} from 'rxjs';
import {UserDto} from '../../dto';
import {PaymentStats} from '../../store/organizations/payment/payment';
import {DefaultWorkspaceDto} from '../../dto/default-workspace.dto';
import {UserHintsDto, UserOnboardingDto} from '../../dto/user.dto';
import {UserInvitationDto} from '../../dto/user-invitation.dto';

export abstract class UserService {
  public abstract createUser(organizationId: string, user: UserDto): Observable<UserDto>;

  public abstract createUsersInWorkspace(
    organizationId: string,
    projectId: string,
    invitations: UserInvitationDto[]
  ): Observable<UserDto[]>;

  public abstract updateUser(organizationId: string, id: string, user: UserDto): Observable<UserDto>;

  public abstract deleteUser(organizationId: string, id: string): Observable<string>;

  public abstract getUsers(organizationId: string): Observable<UserDto[]>;

  public abstract getUser(organizationId: string, userId: string): Observable<UserDto>;

  public abstract getCurrentUser(): Observable<UserDto>;

  public abstract setTeams(organizationId: string, userId: string, teams: string[]): Observable<any>;

  public abstract resendVerificationEmail(): Observable<any>;

  public abstract getUserReferrals(): Observable<PaymentStats>;

  public abstract checkAuthentication(): Observable<any>;

  public abstract patchCurrentUser(user: Partial<UserDto>): Observable<UserDto>;

  public abstract saveDefaultWorkspace(defaultWorkspace: DefaultWorkspaceDto): Observable<any>;

  public abstract sendFeedback(message: string): Observable<any>;

  public abstract scheduleDemo(message: string): Observable<any>;

  public abstract getHints(): Observable<UserHintsDto>;

  public abstract updateHints(hints: UserHintsDto): Observable<UserHintsDto>;

  public abstract updateOnboarding(dto: UserOnboardingDto): Observable<UserOnboardingDto>;

  public abstract logEvent(event: string): Observable<any>;
}
