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

import {AuditLogDto} from '../../dto/audit-log.dto';
import {AuditLog, AuditLogType} from './audit-log.model';
import {resourceTypesMap} from '../../model/resource-type';

export function convertAuditLogDtoToModel(dto: AuditLogDto): AuditLog {
  return {
    id: dto.id,
    parentId: dto.parentId,
    resourceType: resourceTypesMap[dto.resourceType?.toLowerCase()],
    resourceId: dto.resourceId,
    changeDate: dto.changeDate ? new Date(dto.changeDate) : null,
    userId: dto.user,
    type: AuditLogType.Updated,
    userName: dto.userName,
    userEmail: dto.userEmail,
    automation: dto.automation,
    oldState: dto.oldState,
    newState: dto.newState,
  };
}
