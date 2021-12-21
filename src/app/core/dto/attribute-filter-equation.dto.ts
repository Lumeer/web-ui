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

import {AttributeFilterEquation, EquationOperator} from '@lumeer/data-filters/dist/model/attribute-filter';
import {
  AttributeFilterDto,
  convertAttributeFilterDtoToModel,
  convertAttributeFilterModelToDto,
} from './attribute-filter.dto';

export interface AttributeFilterEquationDto {
  equations?: AttributeFilterEquationDto[];
  filter?: AttributeFilterDto;
  operator?: string;
}

export function convertAttributeFilterEquationToDto(equation: AttributeFilterEquation): AttributeFilterEquationDto {
  return (
    equation && {
      equations: (equation.equations || []).map(eq => convertAttributeFilterEquationToDto(eq)).filter(eq => !!eq),
      operator: String(equation.operator),
      filter: convertAttributeFilterModelToDto(equation.filter),
    }
  );
}

export function convertAttributeFilterEquationToModel(dto: AttributeFilterEquationDto): AttributeFilterEquation {
  return (
    dto && {
      equations: (dto.equations || []).map(eq => convertAttributeFilterEquationToModel(eq)).filter(eq => !!eq),
      operator: <EquationOperator>dto.operator,
      filter: convertAttributeFilterDtoToModel(dto.filter),
    }
  );
}
