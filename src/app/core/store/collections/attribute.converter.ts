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

import {convertToBig} from '../../../shared/utils/data.utils';
import {AttributeDto, AttributeFunctionDto, ConstraintDto} from '../../dto/attribute.dto';
import {Constraint, ConstraintType, constraintTypesMap} from '../../model/data/constraint';
import {DateTimeConstraintConfig, NumberConstraintConfig} from '../../model/data/constraint-config';
import {Attribute, AttributeFunction} from './collection';

export function convertAttributeDtoToModel(dto: AttributeDto, correlationId?: string): Attribute {
  return {
    id: dto.id,
    name: dto.name,
    constraint: convertAttributeConstraintDtoToModel(dto.constraint),
    function: convertAttributeFunctionDtoToModel(dto.function),
    usageCount: dto.usageCount,
    correlationId: correlationId,
  };
}

export function convertAttributeModelToDto(model: Attribute): AttributeDto {
  return {
    id: model.id,
    name: model.name,
    constraint: convertAttributeConstraintModelToDto(model.constraint),
    function: convertAttributeFunctionModelToDto(model.function),
  };
}

function convertAttributeConstraintDtoToModel(dto: ConstraintDto): Constraint {
  if (!dto) {
    return null;
  }

  switch (dto.type) {
    case ConstraintType.DateTime:
      return convertDateTimeConstraintDtoToModel(dto);
    case ConstraintType.Number:
      return convertNumberConstraintDtoToModel(dto);
    default:
      return convertAnyConstraintDtoToModel(dto);
  }
}

function convertDateTimeConstraintDtoToModel(dto: ConstraintDto): Constraint {
  return {
    type: ConstraintType.DateTime,
    config: {
      format: dto.config.format,
      minValue: dto.config.minValue && new Date(dto.config.minValue),
      maxValue: dto.config.maxValue && new Date(dto.config.maxValue),
    },
  };
}

function convertNumberConstraintDtoToModel(dto: ConstraintDto): Constraint {
  return {
    type: ConstraintType.Number,
    config: {
      decimal: dto.config.decimal,
      format: dto.config.format,
      precision: dto.config.precision,
      minValue: convertToBig(dto.config.minValue),
      maxValue: convertToBig(dto.config.maxValue),
    },
  };
}

function convertAnyConstraintDtoToModel(dto: ConstraintDto): Constraint {
  return {
    type: constraintTypesMap[dto.type],
    config: dto.config,
  };
}

function convertAttributeConstraintModelToDto(model: Constraint): ConstraintDto {
  if (!model) {
    return null;
  }

  switch (model.type) {
    case ConstraintType.DateTime:
      return {type: model.type, config: convertDateTimeConstraintConfigModelToDto(model.config)};
    case ConstraintType.Number:
      return {type: model.type, config: convertNumberConstraintConfigModelToDto(model.config)};
    default:
      return convertAnyConstraintModelToDto(model);
  }
}

function convertDateTimeConstraintConfigModelToDto(config: Partial<DateTimeConstraintConfig> | any): any {
  return {
    format: config.format,
    minValue: config.minValue,
    maxValue: config.maxValue,
  };
}

function convertNumberConstraintConfigModelToDto(config: Partial<NumberConstraintConfig> | any): any {
  return {
    decimal: config.decimal,
    format: config.format,
    precision: config.precision,
    minValue: config.minValue && config.minValue.toFixed(),
    maxValue: config.maxValue && config.maxValue.toFixed(),
  };
}

function convertAnyConstraintModelToDto(model: Constraint): ConstraintDto {
  return {
    type: model.type,
    config: model.config,
  };
}

function convertAttributeFunctionDtoToModel(dto: AttributeFunctionDto): AttributeFunction {
  return dto && {...dto};
}

function convertAttributeFunctionModelToDto(model: AttributeFunction): AttributeFunctionDto {
  return model && {...model};
}
