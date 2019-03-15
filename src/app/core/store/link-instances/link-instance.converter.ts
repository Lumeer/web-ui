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

import {LinkInstanceDto} from '../../dto';
import {LinkInstance} from './link.instance';

export function convertLinkInstanceDtoToModel(dto: LinkInstanceDto, correlationId?: string): LinkInstance {
  return {
    id: dto.id,
    correlationId,
    linkTypeId: dto.linkTypeId,
    documentIds: dto.documentIds,
    data: dto.data,
    dataVersion: dto.dataVersion,
    creationDate: new Date(dto.creationDate),
    updateDate: dto.updateDate ? new Date(dto.updateDate) : null,
    createdBy: dto.createdBy,
    updatedBy: dto.updatedBy,
  };
}

export function convertLinkInstanceModelToDto(model: LinkInstance): LinkInstanceDto {
  return {
    id: model.id,
    correlationId: model.correlationId,
    linkTypeId: model.linkTypeId,
    documentIds: model.documentIds,
    data: model.data,
  };
}
