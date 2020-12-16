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

import {Perspective} from '../../view/perspectives/perspective';

export enum UserNotificationType {
  OrganizationShared = 'ORGANIZATION_SHARED',
  ProjectShared = 'PROJECT_SHARED',
  CollectionShared = 'COLLECTION_SHARED',
  ViewShared = 'VIEW_SHARED',
  TaskAssigned = 'TASK_ASSIGNED',
  DueDateSoon = 'DUE_DATE_SOON',
  PastDueDate = 'PAST_DUE_DATE',
  StateUpdate = 'STATE_UPDATE',
  TaskUpdated = 'TASK_UPDATED',
  TaskRemoved = 'TASK_REMOVED',
  TaskUnassigned = 'TASK_UNASSIGNED',
  BulkAction = 'BULK_ACTION',
}

export const UserNotificationTypeMap = {
  [UserNotificationType.OrganizationShared]: UserNotificationType.OrganizationShared,
  [UserNotificationType.ProjectShared]: UserNotificationType.ProjectShared,
  [UserNotificationType.CollectionShared]: UserNotificationType.CollectionShared,
  [UserNotificationType.ViewShared]: UserNotificationType.ViewShared,
  [UserNotificationType.TaskAssigned]: UserNotificationType.TaskAssigned,
  [UserNotificationType.DueDateSoon]: UserNotificationType.DueDateSoon,
  [UserNotificationType.PastDueDate]: UserNotificationType.PastDueDate,
  [UserNotificationType.StateUpdate]: UserNotificationType.StateUpdate,
  [UserNotificationType.TaskUpdated]: UserNotificationType.TaskUpdated,
  [UserNotificationType.TaskRemoved]: UserNotificationType.TaskRemoved,
  [UserNotificationType.TaskUnassigned]: UserNotificationType.TaskUnassigned,
  [UserNotificationType.BulkAction]: UserNotificationType.BulkAction,
};

interface BasicUserNotification {
  id?: string;
  userId: string;
  createdAt?: Date;
  read: boolean;
  firstReadAt?: Date;
  deleting?: boolean;
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

export interface TaskAssignedUserNotification extends BasicUserNotification {
  type: UserNotificationType.TaskAssigned;

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

  documentId: string;

  taskName?: string;
  taskNameAttribute?: string;
  taskDueDate?: string;
  taskState?: string;
  taskCompleted?: string;
  assignee?: string;
  collectionQuery?: string;
  documentCursor?: string;
}

export interface DueDateSoonUserNotification extends BasicUserNotification {
  type: UserNotificationType.DueDateSoon;

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

  documentId: string;

  taskName?: string;
  taskNameAttribute?: string;
  taskDueDate?: string;
  taskState?: string;
  taskCompleted?: string;
  assignee?: string;
  collectionQuery?: string;
  documentCursor?: string;
}

export interface PastDueDateUserNotification extends BasicUserNotification {
  type: UserNotificationType.PastDueDate;

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

  documentId: string;

  taskName?: string;
  taskNameAttribute?: string;
  taskDueDate?: string;
  taskState?: string;
  taskCompleted?: string;
  assignee?: string;
  collectionQuery?: string;
  documentCursor?: string;
}

export interface StateUpdateUserNotification extends BasicUserNotification {
  type: UserNotificationType.StateUpdate;

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

  documentId: string;

  taskName?: string;
  taskNameAttribute?: string;
  taskDueDate?: string;
  taskState?: string;
  taskCompleted?: string;
  assignee?: string;
  collectionQuery?: string;
  documentCursor?: string;
}

export interface TaskUpdatedUserNotification extends BasicUserNotification {
  type: UserNotificationType.TaskUpdated;

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

  documentId: string;

  taskName?: string;
  taskNameAttribute?: string;
  taskDueDate?: string;
  taskState?: string;
  taskCompleted?: string;
  assignee?: string;
  collectionQuery?: string;
  documentCursor?: string;
}

export interface TaskRemovedUserNotification extends BasicUserNotification {
  type: UserNotificationType.TaskRemoved;

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

  documentId: string;

  taskName?: string;
  taskNameAttribute?: string;
  taskDueDate?: string;
  taskState?: string;
  taskCompleted?: string;
  assignee?: string;
  collectionQuery?: string;
  documentCursor?: string;
}

export interface TaskUnassignedUserNotification extends BasicUserNotification {
  type: UserNotificationType.TaskUnassigned;

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

  documentId: string;

  taskName?: string;
  taskNameAttribute?: string;
  taskDueDate?: string;
  taskState?: string;
  taskCompleted?: string;
  assignee?: string;
  collectionQuery?: string;
  documentCursor?: string;
}

export interface BulkActionUserNotification extends BasicUserNotification {
  type: UserNotificationType.BulkAction;

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

  documentId: string;
}

export type UserNotification =
  | OrganizationSharedUserNotification
  | ProjectSharedUserNotification
  | CollectionSharedUserNotification
  | ViewSharedUserNotification
  | TaskAssignedUserNotification
  | DueDateSoonUserNotification
  | PastDueDateUserNotification
  | StateUpdateUserNotification
  | TaskUpdatedUserNotification
  | TaskRemovedUserNotification
  | TaskUnassignedUserNotification
  | BulkActionUserNotification;
