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

import {createConstraint} from '../../../shared/utils/constraint/create-constraint';
import {convertToBig} from '../../../shared/utils/data.utils';
import {AttributeDto, AttributeFunctionDto, ConstraintDto} from '../../dto/attribute.dto';
import {Attribute, AttributeFunction} from './collection';
import {
  Constraint,
  ConstraintConfig,
  ConstraintType,
  DateTimeConstraintConfig,
  NumberConstraintConfig,
  SelectConstraintConfig,
  UnknownConstraint,
} from '@lumeer/data-filters';
import {selectDefaultPalette} from '../../../shared/picker/colors';

export function convertAttributeDtoToModel(dto: AttributeDto, correlationId?: string): Attribute {
  return {
    id: dto.id,
    name: dto.name,
    description: dto.description,
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
    description: model.description,
    constraint: convertAttributeConstraintModelToDto(model.constraint),
    function: convertAttributeFunctionModelToDto(model.function),
  };
}

function convertAttributeConstraintDtoToModel(dto: ConstraintDto): Constraint {
  if (!dto) {
    return new UnknownConstraint();
  }

  const config = convertConstraintConfigDtoToModel(dto.type, dto.config);
  return createConstraint(dto.type, config);
}

function convertConstraintConfigDtoToModel(type: string, config: any): ConstraintConfig {
  switch (type) {
    case ConstraintType.DateTime:
      return convertDateTimeConstraintConfigDtoToModel(config);
    case ConstraintType.Number:
      return convertNumberConstraintConfigDtoToModel(config);
    case ConstraintType.Select:
      return convertSelectConstraintConfigDtoToModel(config);
    default:
      return config;
  }
}

function convertDateTimeConstraintConfigDtoToModel(config: any): DateTimeConstraintConfig {
  return {
    ...config,
    minValue: config.minValue && new Date(config.minValue),
    maxValue: config.maxValue && new Date(config.maxValue),
  };
}

function convertNumberConstraintConfigDtoToModel(config: any): NumberConstraintConfig {
  return {
    ...config,
    minValue: convertToBig(config.minValue),
    maxValue: convertToBig(config.maxValue),
  };
}

function convertSelectConstraintConfigDtoToModel(config: any): SelectConstraintConfig {
  return {
    ...config,
    options: (config.options || []).map((option, index) => ({
      ...option,
      background: option.background || selectDefaultPalette[index % selectDefaultPalette.length],
    })),
  };
}

function convertAttributeConstraintModelToDto(model: Constraint): ConstraintDto {
  if (!model) {
    return null;
  }

  switch (model.type) {
    case ConstraintType.Number:
      return {type: model.type, config: convertNumberConstraintConfigModelToDto(model.config)};
    default:
      return convertAnyConstraintModelToDto(model);
  }
}

function convertNumberConstraintConfigModelToDto(config: Partial<NumberConstraintConfig> | any): any {
  return {
    ...config,
    minValue: config.minValue?.toFixed(),
    maxValue: config.maxValue?.toFixed(),
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
