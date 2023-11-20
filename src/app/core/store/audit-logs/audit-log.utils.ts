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
import {ResourceType} from '../../model/resource-type';
import {AuditLog} from './audit-log.model';

export function isProjectAuditLogByUser(log: AuditLog, projectId: string, userId: string) {
  return log.userId === userId && isProjectAuditLog(log, projectId);
}

export function isProjectAuditLog(log: AuditLog, projectId: string) {
  return (
    (log.resourceType === ResourceType.Project && log.resourceId === projectId) ||
    [
      ResourceType.Collection,
      ResourceType.LinkType,
      ResourceType.View,
      ResourceType.Document,
      ResourceType.Link,
    ].includes(log.resourceType)
  );
}

export function isCollectionAuditLog(log: AuditLog, collectionId: string) {
  return (
    (log.resourceType === ResourceType.Collection && log.resourceId === collectionId) ||
    (log.resourceType === ResourceType.Document && log.parentId === collectionId)
  );
}

export function isLinkTypeAuditLog(log: AuditLog, linkTypeId: string) {
  return (
    (log.resourceType === ResourceType.LinkType && log.resourceId === linkTypeId) ||
    (log.resourceType === ResourceType.Link && log.parentId === linkTypeId)
  );
}

export function isDocumentAuditLog(log: AuditLog, documentId: string) {
  return log.resourceType === ResourceType.Document && log.resourceId === documentId;
}

export function isLinkAuditLog(log: AuditLog, linkInstanceId: string) {
  return log.resourceType === ResourceType.Link && log.resourceId === linkInstanceId;
}
