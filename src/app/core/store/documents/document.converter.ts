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

import {Document} from '../../dto/document';
import {DocumentModel} from './document.model';

export class DocumentConverter {

  public static fromDto(dto: Document, correlationId?: string): DocumentModel {
    const data = {...dto.data};
    delete data['_id'];

    return {
      id: dto.id,
      collectionCode: dto.collectionCode,
      collectionId: dto.collectionId,
      data: data,
      favorite: dto.favorite,
      creationDate: dto.creationDate,
      updateDate: dto.updateDate,
      createdBy: dto.createdBy,
      updatedBy: dto.updatedBy,
      dataVersion: dto.dataVersion,
      correlationId: correlationId
    };
  }

  public static toDto(model: DocumentModel): Document {
    return {
      id: model.id,
      collectionId: model.collectionId,
      collectionCode: model.collectionCode,
      data: model.data,
      favorite: model.favorite
    };
  }

}
