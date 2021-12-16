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

import {AllowedPermissions} from '../../model/allowed-permissions';
import {LinkType} from '../link-types/link.type';
import {Query} from '../navigation/query/query';
import {getQueryFiltersForCollection, getQueryFiltersForLinkType} from '../navigation/query/query.util';
import {Attribute, Collection} from './collection';
import {AttributeFilter, ConditionType, Constraint, ConstraintType} from '@lumeer/data-filters';
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

export function isCollectionAttributeEditable(
  attributeId: string,
  collection: Collection,
  permissions: AllowedPermissions,
  query?: Query
): boolean {
  const attribute = attributeId && (collection?.attributes || []).find(attr => attr.id === attributeId);
  return isAttributeEditable(attribute) && !isCollectionAttributeLockedByQuery(query, collection, attributeId);
}

export function isCollectionAttributeLockedByQuery(query: Query, collection: Collection, attributeId: string): boolean {
  if (!query) {
    return false;
  }

  const collectionFilters = getQueryFiltersForCollection(query, collection.id);
  return isAttributeLockedByFilters(collectionFilters, attributeId);
}

function isAttributeLockedByFilters(filters: AttributeFilter[], attributeId: string): boolean {
  return filters
    .filter(filter => filter.attributeId === attributeId)
    .some(filter => filter.condition === ConditionType.Equals);
}

export function isLinkTypeAttributeEditable(
  attributeId: string,
  linkType: LinkType,
  permissions: AllowedPermissions,
  query?: Query
): boolean {
  const attribute = attributeId && (linkType?.attributes || []).find(attr => attr.id === attributeId);
  return isAttributeEditable(attribute) && !isLinkTypeAttributeLockedByQuery(query, linkType, attributeId);
}

export function isLinkTypeAttributeLockedByQuery(query: Query, linkType: LinkType, attributeId: string): boolean {
  if (!query) {
    return false;
  }

  const linkFilters = getQueryFiltersForLinkType(query, linkType.id);
  return isAttributeLockedByFilters(linkFilters, attributeId);
}

// parentId can be linkTypeId or collectionId
export function isAttributeEditableWithQuery(
  attribute: Attribute,
  parentId: string,
  permissions: AllowedPermissions,
  query: Query
): boolean {
  const filters = [...getQueryFiltersForCollection(query, parentId), ...getQueryFiltersForLinkType(query, parentId)];

  if (!attribute) {
    return true;
  }

  return isAttributeEditable(attribute) && !isAttributeLockedByFilters(filters, attribute.id);
}

function isAttributeEditable(attribute: Attribute): boolean {
  // TODO locked conditions
  return !attribute || !attribute.function || !attribute.function.js || !attribute.lock?.locked;
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
