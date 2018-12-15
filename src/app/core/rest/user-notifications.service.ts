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
import {environment} from '../../../environments/environment';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {UserNotificationDto} from '../dto/user-notification.dto';

@Injectable()
export class UserNotificationsService {
  constructor(private httpClient: HttpClient) {}

  public getNotifications(): Observable<UserNotificationDto[]> {
    return this.httpClient.get<UserNotificationDto[]>(this.notificationsApiPrefix());
  }

  public updateNotification(
    notificationId: string,
    userNotification: UserNotificationDto
  ): Observable<UserNotificationDto> {
    return this.httpClient.put<UserNotificationDto>(
      `${this.notificationsApiPrefix()}/${notificationId}`,
      userNotification
    );
  }

  private notificationsApiPrefix(): string {
    return `${environment.apiUrl}/rest/notifications`;
  }
}
