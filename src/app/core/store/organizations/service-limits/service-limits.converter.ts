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

import {ServiceLimitsDto} from '../../../dto/service-limits.dto';
import {ServiceLimits} from './service.limits';
import {serviceLevelMap, ServiceLevelType} from '../../../dto/service-level-type';

export class ServiceLimitsConverter {
  public static fromDto(organizationId: string, dto: ServiceLimitsDto): ServiceLimits {
    return {
      organizationId: organizationId,
      serviceLevel: serviceLevelMap[dto.serviceLevel],
      users: dto.users,
      projects: dto.projects,
      files: dto.files,
      documents: dto.documents,
      dbSizeMb: dto.dbSizeMb,
      validUntil: new Date(dto.validUntil),
    };
  }

  public static toDto(model: ServiceLimits): ServiceLimitsDto {
    return {
      serviceLevel: model.serviceLevel,
      users: model.users,
      projects: model.projects,
      files: model.files,
      documents: model.documents,
      dbSizeMb: model.dbSizeMb,
      validUntil: model.validUntil.getTime(),
    };
  }
}
