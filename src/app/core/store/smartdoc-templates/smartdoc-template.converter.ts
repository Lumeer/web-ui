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
import {SmartDocTemplateDto, SmartDocTemplatePartDto} from '../../dto/smartdoc-template.dto';
import {SmartDocTemplateModel, SmartDocTemplatePartModel, SmartDocTemplatePartType} from './smartdoc-template.model';

export class SmartDocTemplateConverter {

  public static fromDto(dto: SmartDocTemplateDto, correlationId?: string): SmartDocTemplateModel {
    return {
      id: dto.id,
      collectionCode: dto.collectionCode,
      parts: dto.parts.map(SmartDocTemplateConverter.fromPartDto),
      correlationId: correlationId
    };
  }

  private static fromPartDto(partDto: SmartDocTemplatePartDto): SmartDocTemplatePartModel {
    return {
      type: SmartDocTemplateConverter.typeFromString(partDto.type),
      textHtml: partDto.textHtml,
      textData: partDto.textData,
      linkTypeId: partDto.linkTypeId,
      perspective: perspectivesMap[partDto.perspective],
      templateId: partDto.templateId
    };
  }

  public static toDto(model: SmartDocTemplateModel): SmartDocTemplateDto {
    return {
      id: model.id,
      collectionCode: model.collectionCode,
      parts: model.parts.map(SmartDocTemplateConverter.toPartDto)
    };
  }

  private static toPartDto(partModel: SmartDocTemplatePartModel): SmartDocTemplatePartDto {
    return {
      type: partModel.type,
      textHtml: partModel.textHtml,
      textData: partModel.textData,
      linkTypeId: partModel.linkTypeId,
      perspective: partModel.perspective,
      templateId: partModel.templateId
    };
  }

  private static typeFromString(type: string): SmartDocTemplatePartType {
    switch (type) {
      case SmartDocTemplatePartType.Attachments:
        return SmartDocTemplatePartType.Attachments;
      case SmartDocTemplatePartType.Embedded:
        return SmartDocTemplatePartType.Embedded;
      case SmartDocTemplatePartType.Text:
        return SmartDocTemplatePartType.Text;
      default:
        throw new TypeError('Unknown template part type: ' + type);
    }
  }
}
