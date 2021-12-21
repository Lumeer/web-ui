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

import {AttributeFilter, ConditionType} from '@lumeer/data-filters';
import {CollectionAttributeFilter, LinkAttributeFilter} from '../store/navigation/query/query';
import {ConditionValueDto} from './query.dto';

export interface AttributeFilterDto {
  condition: string;
  attributeId: string;
  value?: any;
  conditionValues: ConditionValueDto[];
}

export interface CollectionAttributeFilterDto extends AttributeFilterDto {
  collectionId: string;
}

export interface LinkAttributeFilterDto extends AttributeFilterDto {
  linkTypeId: string;
}

export function convertCollectionAttributeFilterDtoToModel(
  dto: CollectionAttributeFilterDto
): CollectionAttributeFilter {
  return {
    collectionId: dto.collectionId,
    ...convertAttributeFilterDtoToModel(dto),
  };
}

export function convertLinkAttributeFilterDtoToModel(dto: LinkAttributeFilterDto): LinkAttributeFilter {
  return {
    linkTypeId: dto.linkTypeId,
    ...convertAttributeFilterDtoToModel(dto),
  };
}

export function convertAttributeFilterDtoToModel(dto: AttributeFilterDto): AttributeFilter {
  return (
    dto && {
      attributeId: dto.attributeId,
      condition: <ConditionType>dto.condition,
      conditionValues: (dto.conditionValues || []).map(item => ({value: item.value, type: item.type})),
    }
  );
}

export function convertCollectionAttributeFilterModelToDto(
  model: CollectionAttributeFilter
): CollectionAttributeFilterDto {
  return {
    collectionId: model.collectionId,
    ...convertAttributeFilterModelToDto(model),
  };
}

export function convertLinkAttributeFilterModelToDto(model: LinkAttributeFilter): LinkAttributeFilterDto {
  return {
    linkTypeId: model.linkTypeId,
    ...convertAttributeFilterModelToDto(model),
  };
}

export function convertAttributeFilterModelToDto(model: AttributeFilter): AttributeFilterDto {
  return (
    model && {
      attributeId: model.attributeId,
      condition: model.condition,
      conditionValues: (model.conditionValues || []).map(item => ({value: item.value, type: item.type})),
    }
  );
}
