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

import {Injectable, Pipe, PipeTransform} from '@angular/core';
import {UserNotification, UserNotificationType} from '../../../../core/model/user-notification';

@Pipe({
  name: 'validNotificationFilter',
})
@Injectable({
  providedIn: 'root',
})
export class ValidNotificationFilterPipe implements PipeTransform {
  public transform(value: UserNotification[], args?: any): UserNotification[] {
    return value.filter(notification => this.isValid(notification));
  }

  private isValid(notification: UserNotification): boolean {
    switch (notification.type) {
      case UserNotificationType.OrganizationShared:
        return !!notification.organizationId;
      case UserNotificationType.ProjectShared:
        return !!notification.projectId && !!notification.organizationId;
      case UserNotificationType.CollectionShared:
        return !!notification.collectionId && !!notification.projectId && !!notification.organizationId;
      case UserNotificationType.ViewShared:
        return !!notification.viewCode && !!notification.projectId && !!notification.organizationId;
      default:
        return false;
    }
  }
}
