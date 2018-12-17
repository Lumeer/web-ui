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

import {UserNotificationDto} from '../../dto/user-notification.dto';
import {UserNotification, UserNotificationType, UserNotificationTypeMap} from '../../model/user-notification';
import {perspectivesMap} from '../../../view/perspectives/perspective';

export namespace UserNotificationConverter {
  export function fromDtos(dtos: UserNotificationDto[]): UserNotification[] {
    return dtos.map(dto => UserNotificationConverter.fromDto(dto)).filter(model => !!model);
  }

  export function fromDto(dto: UserNotificationDto): UserNotification {
    const model = {
      type: UserNotificationTypeMap[dto.type],
      id: dto.id,
      userId: dto.userId,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : undefined,
      firstReadAt: dto.firstReadAt ? new Date(dto.firstReadAt) : undefined,
      read: dto.read,
    };

    switch (model.type) {
      case UserNotificationType.OrganizationShared:
        return {
          ...model,
          organizationId: dto.data.organizationId,
        };
      case UserNotificationType.ProjectShared:
        return {
          ...model,
          organizationId: dto.data.organizationId,
          projectId: dto.data.projectId,
          projectIcon: dto.data.projectIcon,
          projectColor: dto.data.projectColor,
          projectCode: dto.data.projectCode,
          projectName: dto.data.projectName,
        };
      case UserNotificationType.CollectionShared:
        return {
          ...model,
          organizationId: dto.data.organizationId,
          projectId: dto.data.projectId,
          projectIcon: dto.data.projectIcon,
          projectColor: dto.data.projectColor,
          projectCode: dto.data.projectCode,
          projectName: dto.data.projectName,
          collectionId: dto.data.collectionId,
          collectionIcon: dto.data.collectionIcon,
          collectionColor: dto.data.collectionColor,
          collectionName: dto.data.collectionName,
        };
      case UserNotificationType.ViewShared:
        return {
          ...model,
          organizationId: dto.data.organizationId,
          projectId: dto.data.projectId,
          projectIcon: dto.data.projectIcon,
          projectColor: dto.data.projectColor,
          projectCode: dto.data.projectCode,
          projectName: dto.data.projectName,
          viewCode: dto.data.viewCode,
          viewName: dto.data.viewName,
          viewPerspective: perspectivesMap[dto.data.viewPerspective],
        };
      default:
        return null;
    }
  }

  export function toDto(model: UserNotification): UserNotificationDto {
    return {
      id: model.id,
      userId: model.userId,
      type: UserNotificationType[model.type],
      read: model.read,
      // data cannot be updated by frontend anyway
      // no date fields can be updated by frontend
    };
  }
}
