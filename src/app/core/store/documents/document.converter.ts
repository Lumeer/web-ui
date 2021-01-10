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

import {DocumentDto} from '../../dto';
import {DocumentModel} from './document.model';
import {Attribute} from '../collections/collection';
import {objectsByIdMap} from '../../../shared/utils/common.utils';
import {ConstraintData} from '../../model/data/constraint';
import {DataResourceData, DataResourceDataValues} from '../../model/resource';
import {convertDataToDataValues} from '../../../shared/utils/data-resource.utils';

export function convertDocumentDtoToModel(
  dto: DocumentDto,
  attributes: Attribute[],
  constraintData: ConstraintData,
  correlationId?: string
): DocumentModel {
  const data = {...dto.data};
  delete data['_id'];

  return {
    id: dto.id,
    collectionId: dto.collectionId,
    data,
    dataValues: convertDataToDataValues(data, attributes, constraintData),
    metaData: dto.metaData,
    favorite: dto.favorite,
    creationDate: new Date(dto.creationDate),
    updateDate: dto.updateDate ? new Date(dto.updateDate) : null,
    createdBy: dto.createdBy,
    updatedBy: dto.updatedBy,
    commentsCount: dto.commentsCount,
    dataVersion: dto.dataVersion,
    correlationId,
  };
}

export function convertDocumentModelToDto(model: DocumentModel | Partial<DocumentModel>): DocumentDto {
  return {
    id: model.id,
    correlationId: model.correlationId,
    collectionId: model.collectionId,
    data: model.data,
    metaData: model.metaData,
    favorite: model.favorite,
    dataVersion: model.dataVersion,
  };
}
