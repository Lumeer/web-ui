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
import {ConstraintType} from '@lumeer/data-filters';

import {Collection} from '../../core/store/collections/collection';
import {DocumentModel} from '../../core/store/documents/document.model';
import {LinkInstance} from '../../core/store/link-instances/link.instance';
import {LinkType} from '../../core/store/link-types/link.type';

export function hasFilesAttributeChanged(
  parent: Collection | LinkType,
  entity: DocumentModel | LinkInstance,
  previousEntity: DocumentModel | LinkInstance
): boolean {
  const filesAttributeIds = ((parent && parent.attributes) || [])
    .filter(attr => attr.constraint && attr.constraint.type === ConstraintType.Files)
    .map(attr => attr.id);

  if (filesAttributeIds.length === 0) {
    return false;
  }

  return filesAttributeIds.some(
    attrId =>
      ((entity && entity.data && entity.data[attrId]) || '') !==
      ((previousEntity && previousEntity.data && previousEntity.data[attrId]) || '')
  );
}
