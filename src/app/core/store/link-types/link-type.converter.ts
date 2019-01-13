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

import {LinkTypeDto} from '../../dto';
import {Collection} from '../collections/collection';
import {LinkType} from './link.type';

export class LinkTypeConverter {
  public static fromDto(dto: LinkTypeDto, correlationId?: string): LinkType {
    return {
      id: dto.id,
      name: dto.name,
      collectionIds: dto.collectionIds,
      attributes: [], // TODO
      correlationId: correlationId,
      version: dto.version,
    };
  }

  public static toDto(model: LinkType): LinkTypeDto {
    return {
      id: model.id,
      name: model.name,
      collectionIds: model.collectionIds,
      attributes: [], // TODO
    };
  }

  public static addCollections(linkType: LinkType, collections: Collection[]): LinkType {
    const usedCollections: [Collection, Collection] = [
      collections.find(collection => collection.id === linkType.collectionIds[0]),
      collections.find(collection => collection.id === linkType.collectionIds[1]),
    ];
    return {...linkType, collections: usedCollections};
  }
}
