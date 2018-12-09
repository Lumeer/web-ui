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

import {Attribute, CollectionDto} from '../../dto';
import {PermissionsConverter} from '../permissions/permissions.converter';
import {AttributeModel, CollectionModel} from './collection.model';

export class CollectionConverter {
  public static fromDto(dto: CollectionDto, correlationId?: string): CollectionModel {
    return {
      id: dto.id,
      code: dto.code,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      icon: dto.icon,
      attributes: dto.attributes
        ? dto.attributes
            .map(attr => CollectionConverter.fromAttributeDto(attr))
            .sort((a, b) => +a.id.substring(1) - +b.id.substring(1))
        : [],
      defaultAttributeId: dto.defaultAttributeId,
      permissions: dto.permissions ? PermissionsConverter.fromDto(dto.permissions) : null,
      documentsCount: dto.documentsCount,
      correlationId: correlationId,
      favorite: dto.favorite,
      lastTimeUsed: new Date(dto.lastTimeUsed),
    };
  }

  public static toDto(model: CollectionModel): CollectionDto {
    return {
      id: model.id,
      code: model.code,
      name: model.name,
      description: model.description,
      color: model.color,
      icon: model.icon,
      attributes: model.attributes ? model.attributes.map(CollectionConverter.toAttributeDto) : [],
      permissions: model.permissions ? PermissionsConverter.toDto(model.permissions) : null,
    };
  }

  public static fromAttributeDto(attributeDto: Attribute, correlationId?: string): AttributeModel {
    return {
      id: attributeDto.id,
      name: attributeDto.name,
      usageCount: attributeDto.usageCount,
      correlationId: correlationId,
    };
  }

  public static toAttributeDto(attributeModel: AttributeModel): Attribute {
    return {
      id: attributeModel.id,
      name: attributeModel.name,
      constraints: [],
      usageCount: attributeModel.usageCount, // TODO maybe not needed this way
    };
  }
}
