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

import {perspectivesMap} from '../../../view/perspectives/perspective';
import {TemplateDto, TemplatePartDto} from '../../dto/template.dto';
import {TemplateModel, TemplatePartModel, TemplatePartType} from './template.model';

export class TemplateConverter {

  public static fromDto(dto: TemplateDto, correlationId?: string): TemplateModel {
    return {
      id: dto.id,
      collectionCode: dto.collectionCode,
      parts: dto.parts.map(TemplateConverter.fromPartDto),
      correlationId: correlationId
    };
  }

  private static fromPartDto(partDto: TemplatePartDto): TemplatePartModel {
    return {
      type: TemplateConverter.typeFromString(partDto.type),
      text: partDto.text,
      linkTypeId: partDto.linkTypeId,
      perspective: perspectivesMap[partDto.perspective],
      templateId: partDto.templateId
    };
  }

  public static toDto(model: TemplateModel): TemplateDto {
    return {
      id: model.id,
      collectionCode: model.collectionCode,
      parts: model.parts.map(TemplateConverter.toPartDto)
    };
  }

  private static toPartDto(partModel: TemplatePartModel): TemplatePartDto {
    return {
      type: partModel.type,
      text: partModel.text,
      linkTypeId: partModel.linkTypeId,
      perspective: partModel.perspective,
      templateId: partModel.templateId
    };
  }

  private static typeFromString(type: string): TemplatePartType {
    switch (type) {
      case TemplatePartType.Attachments:
        return TemplatePartType.Attachments;
      case TemplatePartType.Embedded:
        return TemplatePartType.Embedded;
      case TemplatePartType.Text:
        return TemplatePartType.Text;
      default:
        throw new TypeError('Unknown template part type: ' + type);
    }
  }
}
