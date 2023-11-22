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
import {CollectionDto} from '../../dto';
import {CollectionPurposeDto} from '../../dto/collection.dto';
import {ImportedCollectionDto} from '../../dto/imported-collection.dto';
import {convertPermissionsDtoToModel} from '../permissions/permissions.converter';
import {convertRulesFromDto, convertRulesToDto} from '../utils/store.utils';
import {convertAttributeDtoToModel, convertAttributeModelToDto} from './attribute.converter';
import {
  Collection,
  CollectionPurpose,
  CollectionPurposeType,
  ImportedCollection,
  collectionPurposesMap,
} from './collection';

export function convertCollectionDtoToModel(
  dto: CollectionDto,
  correlationId?: string,
  preventSortAttributes?: boolean
): Collection {
  const attributes = dto.attributes ? dto.attributes.map(attribute => convertAttributeDtoToModel(attribute)) : [];
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    color: dto.color,
    icon: dto.icon,
    priority: dto.priority,
    attributes: !preventSortAttributes
      ? attributes.sort((a, b) => +a.id?.substring(1) - +b.id?.substring(1))
      : attributes,
    defaultAttributeId: dto.defaultAttributeId,
    permissions: dto.permissions ? convertPermissionsDtoToModel(dto.permissions) : null,
    documentsCount: dto.documentsCount,
    correlationId: correlationId,
    favorite: dto.favorite,
    lastTimeUsed: new Date(dto.lastTimeUsed),
    version: dto.version,
    rules: convertRulesFromDto(dto.rules),
    purpose: {
      type: collectionPurposesMap[dto.purpose?.type] || CollectionPurposeType.None,
      metaData: dto.purpose?.metaData || {},
    },
  };
}

export function convertCollectionModelToDto(model: Collection): CollectionDto {
  return {
    id: model.id,
    correlationId: model.correlationId,
    code: model.code,
    name: model.name,
    description: model.description,
    color: model.color,
    icon: model.icon,
    priority: model.priority,
    attributes: model.attributes?.map(convertAttributeModelToDto) || [],
    rules: convertRulesToDto(model.rules),
    purpose: convertCollectionPurposeModelToDto(model.purpose),
  };
}

export function convertImportedCollectionModelToDto(model: ImportedCollection): ImportedCollectionDto {
  return {
    collection: model.collection && convertCollectionModelToDto(model.collection),
    data: model.data,
    type: model.type?.toString(),
    mergeAttributeId: model.mergeAttributeId,
  };
}

export function convertCollectionPurposeModelToDto(model: CollectionPurpose): CollectionPurposeDto {
  return model;
}
