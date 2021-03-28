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

import {ResourceCommentDto} from '../../dto/resource-comment.dto';
import {ResourceCommentModel} from './resource-comment.model';
import {resourceTypesMap} from '../../model/resource-type';

export function convertResourceCommentDtoToModel(
  dto: ResourceCommentDto,
  correlationId?: string
): ResourceCommentModel {
  return {
    id: dto.id,
    resourceType: resourceTypesMap[dto.resourceType?.toLowerCase()],
    resourceId: dto.resourceId,
    metaData: dto.metaData,
    creationDate: new Date(dto.creationDate),
    updateDate: dto.updateDate ? new Date(dto.updateDate) : null,
    author: dto.author,
    authorEmail: dto.authorEmail,
    authorName: dto.authorName,
    comment: dto.comment,
    correlationId,
  };
}

export function convertResourceCommentModelToDto(
  model: ResourceCommentModel | Partial<ResourceCommentModel>
): ResourceCommentDto {
  return {
    id: model.id,
    correlationId: model.correlationId,
    resourceType: model.resourceType.toUpperCase(),
    resourceId: model.resourceId,
    metaData: model.metaData,
    comment: model.comment,
  };
}
