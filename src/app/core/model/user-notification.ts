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

import {Perspective} from '../../view/perspectives/perspective';

export enum UserNotificationType {
  OrganizationShared = 'ORGANIZATION_SHARED',
  ProjectShared = 'PROJECT_SHARED',
  CollectionShared = 'COLLECTION_SHARED',
  ViewShared = 'VIEW_SHARED',
}

export const UserNotificationTypeMap = {
  [UserNotificationType.OrganizationShared]: UserNotificationType.OrganizationShared,
  [UserNotificationType.ProjectShared]: UserNotificationType.ProjectShared,
  [UserNotificationType.CollectionShared]: UserNotificationType.CollectionShared,
  [UserNotificationType.ViewShared]: UserNotificationType.ViewShared,
};

interface BasicUserNotification {
  id?: string;
  userId: string;
  createdAt?: Date;
  read: boolean;
  firstReadAt?: Date;
}

export interface OrganizationSharedUserNotification extends BasicUserNotification {
  type: UserNotificationType.OrganizationShared;
  organizationId: string;
}

export interface ProjectSharedUserNotification extends BasicUserNotification {
  type: UserNotificationType.ProjectShared;
  organizationId: string;
  projectId: string;
  projectIcon: string;
  projectColor: string;
  projectCode: string;
  projectName: string;
}

export interface CollectionSharedUserNotification extends BasicUserNotification {
  type: UserNotificationType.CollectionShared;
  organizationId: string;
  projectId: string;
  projectIcon: string;
  projectColor: string;
  projectCode: string;
  projectName: string;
  collectionId: string;
  collectionIcon: string;
  collectionColor: string;
  collectionName: string;
}

export interface ViewSharedUserNotification extends BasicUserNotification {
  type: UserNotificationType.ViewShared;
  organizationId: string;
  projectId: string;
  projectIcon: string;
  projectColor: string;
  projectCode: string;
  projectName: string;
  viewCode: string;
  viewName: string;
  viewPerspective: Perspective;
}

export type UserNotification =
  | OrganizationSharedUserNotification
  | ProjectSharedUserNotification
  | CollectionSharedUserNotification
  | ViewSharedUserNotification;
