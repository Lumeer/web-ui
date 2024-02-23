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
import {serviceLevelMap} from '../../../dto/service-level-type';
import {ServiceLimitsDto} from '../../../dto/service-limits.dto';
import {ServiceLimits} from './service.limits';

export function convertServiceLimitsDtoToModel(organizationId: string, dto: ServiceLimitsDto): ServiceLimits {
  return {
    organizationId: organizationId,
    serviceLevel: serviceLevelMap[dto.serviceLevel],
    users: dto.users,
    projects: dto.projects,
    files: dto.files,
    documents: dto.documents,
    groups: dto.groups,
    fileSizeMb: dto.fileSizeMb,
    auditDays: dto.auditDays,
    dbSizeMb: dto.dbSizeMb,
    validUntil: new Date(dto.validUntil),
    rulesPerCollection: dto.rulesPerCollection,
    functionsPerCollection: dto.functionsPerCollection,
    maxCreatedRecords: dto.maxCreatedRecords,
    maxViewReadRecords: dto.maxViewReadRecords,
    automationTimeout: dto.automationTimeout,
  };
}
