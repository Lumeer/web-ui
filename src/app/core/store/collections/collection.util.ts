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

import {LinkType} from '../link-types/link.type';
import {Attribute, Collection} from './collection';
import {Constraint, ConstraintType} from '@lumeer/data-filters';
import {safeGetRandomIcon} from '../../../shared/picker/icons';
import * as Colors from '../../../shared/picker/colors';

export function createEmptyCollection(): Collection {
  const colors = Colors.palette;
  return {
    name: '',
    color: colors[Math.round(Math.random() * colors.length)],
    icon: safeGetRandomIcon(),
    description: '',
    attributes: [],
  };
}

export function getDefaultAttributeId(collection: Collection): string {
  if (!collection) {
    return null;
  }
  if (collection.defaultAttributeId) {
    const defaultAttribute = collection.attributes.find(attr => attr.id === collection.defaultAttributeId);
    if (defaultAttribute) {
      return collection.defaultAttributeId;
    }
  }

  const attributes = collection.attributes || [];
  if (attributes.length > 0) {
    return attributes[0].id;
  }

  return '';
}

export function mergeCollections(collectionsA: Collection[], collectionsB: Collection[]): Collection[] {
  const collectionsAIds = (collectionsA || []).map(collection => collection.id);
  const collectionsBToAdd = (collectionsB || []).filter(collection => !collectionsAIds.includes(collection.id));
  return (collectionsA || []).concat(collectionsBToAdd);
}

export function findAttribute(attributes: Attribute[], attributeId: string): Attribute {
  return attributeId && (attributes || []).find(attr => attr.id === attributeId);
}

export function findAttributeConstraint(attributes: Attribute[], attributeId: string): Constraint {
  return findAttribute(attributes, attributeId)?.constraint;
}

export function hasAttributeType(entity: Collection | LinkType, constraintType: ConstraintType): boolean {
  return (entity?.attributes || []).some(attr => attr.constraint && attr.constraint.type === constraintType);
}
