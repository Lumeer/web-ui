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

import {AttributeDto, CollectionDto} from '../../dto';
import {PermissionsConverter} from '../permissions/permissions.converter';
import {Constraint, constraintTypesMap} from '../../model/data/constraint';
import {ConstraintDto} from '../../dto/attribute.dto';
import {Attribute, Collection, ImportedCollection} from './collection';
import {ImportedCollectionDto} from '../../dto/imported-collection.dto';
import {RuleDto} from '../../dto/collection.dto';
import {Rule, RuleTiming, RuleTimingMap, RuleType, RuleTypeMap} from '../../model/rule';

export function convertCollectionDtoToModel(dto: CollectionDto, correlationId?: string): Collection {
  return {
    id: dto.id,
    code: dto.code,
    name: dto.name,
    description: dto.description,
    color: dto.color,
    icon: dto.icon,
    attributes: dto.attributes
      ? dto.attributes
          .map(attribute => convertAttributeDtoToModel(attribute))
          .sort((a, b) => +a.id.substring(1) - +b.id.substring(1))
      : [],
    defaultAttributeId: dto.defaultAttributeId,
    permissions: dto.permissions ? PermissionsConverter.fromDto(dto.permissions) : null,
    documentsCount: dto.documentsCount,
    correlationId: correlationId,
    favorite: dto.favorite,
    lastTimeUsed: new Date(dto.lastTimeUsed),
    version: dto.version,
    rules: convertRulesFromDto(dto.rules),
  };
}

export function convertCollectionModelToDto(model: Collection): CollectionDto {
  return {
    id: model.id,
    code: model.code,
    name: model.name,
    description: model.description,
    color: model.color,
    icon: model.icon,
    attributes: model.attributes ? model.attributes.map(convertAttributeModelToDto) : [],
    permissions: model.permissions ? PermissionsConverter.toDto(model.permissions) : null,
    rules: convertRulesToDto(model.rules),
  };
}

export function convertAttributeDtoToModel(dto: AttributeDto, correlationId?: string): Attribute {
  return {
    id: dto.id,
    name: dto.name,
    constraint: convertAttributeConstraintDtoToModel(dto.constraint),
    usageCount: dto.usageCount,
    correlationId: correlationId,
  };
}

export function convertAttributeModelToDto(model: Attribute): AttributeDto {
  return {
    id: model.id,
    name: model.name,
    constraint: convertAttributeConstraintModelToDto(model.constraint),
  };
}

function convertAttributeConstraintDtoToModel(dto: ConstraintDto): Constraint {
  return (
    dto && {
      type: constraintTypesMap[dto.type],
      config: dto.config,
    }
  );
}

function convertAttributeConstraintModelToDto(model: Constraint): ConstraintDto {
  return (
    model && {
      type: model.type,
      config: model.config,
    }
  );
}

export function convertImportedCollectionModelToDto(model: ImportedCollection): ImportedCollectionDto {
  return {
    collection: convertCollectionModelToDto(model.collection),
    data: model.data,
  };
}

function convertRulesFromDto(dto: Record<string, RuleDto>): Rule[] {
  return Object.keys(dto || {}).map<Rule>(
    name =>
      ({
        name: name,
        type: RuleTypeMap[dto[name].type],
        timing: RuleTimingMap[dto[name].timing],
        configuration: dto[name].configuration,
      } as Rule) // TODO avoid type casting
  );
}

function convertRulesToDto(model: Rule[]): Record<string, RuleDto> {
  if (!model) {
    return {};
  }

  return model.reduce((result, rule) => {
    result[rule.name] = {
      type: RuleType[rule.type],
      timing: RuleTiming[rule.timing],
      configuration: rule.configuration,
    };
    return result;
  }, {});
}
