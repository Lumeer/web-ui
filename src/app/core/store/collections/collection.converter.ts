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

import {Attribute} from '../../dto/attribute';
import {Collection} from '../../dto/collection';
import {PermissionsConverter} from '../permissions/permissions.converter';
import {AttributeModel, CollectionModel} from './collection.model';

export class CollectionConverter {

  public static fromDto(dto: Collection, correlationId?: string): CollectionModel {
    return {
      // TODO convert 'id' as well
      code: dto.code,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      icon: dto.icon,
      attributes: dto.attributes ? dto.attributes.map(CollectionConverter.fromAttributeDto) : [],
      defaultAttributeId: dto.defaultAttribute ? dto.defaultAttribute.fullName : null,
      permissions: dto.permissions ? PermissionsConverter.fromDto(dto.permissions) : null,
      documentsCount: dto.documentsCount,
      correlationId: correlationId,
      favourite: dto.isFavorite
    };
  }

  public static toDto(model: CollectionModel): Collection {
    let defaultAttribute = null;
    if (model.attributes) {
      const modelDefaultAttribute = model.attributes.find(attr => attr.id === model.defaultAttributeId);
      defaultAttribute = modelDefaultAttribute || null;
    }

    return {
      // TODO convert 'id' as well
      code: model.code,
      name: model.name,
      description: model.description,
      color: model.color,
      icon: model.icon,
      attributes: model.attributes ? model.attributes.map(CollectionConverter.toAttributeDto) : [],
      defaultAttribute: defaultAttribute,
      permissions: model.permissions ? PermissionsConverter.toDto(model.permissions) : null,
      documentsCount: model.documentsCount, // TODO maybe not needed this way
      isFavorite: model.favourite
    };
  }

  public static fromAttributeDto(attributeDto: Attribute): AttributeModel {
    return {
      id: attributeDto.fullName,
      name: attributeDto.name,
      // TODO convert 'intermediate' as well
      constraints: attributeDto.constraints,
      usageCount: attributeDto.usageCount
    };
  }

  public static toAttributeDto(attributeModel: AttributeModel): Attribute {
    return {
      fullName: attributeModel.id,
      name: attributeModel.name,
      // TODO convert 'intermediate' as well
      constraints: attributeModel.constraints,
      usageCount: attributeModel.usageCount  // TODO maybe not needed this way
    };
  }

}
