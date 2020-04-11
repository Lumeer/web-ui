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

import {AttributesResource, AttributesResourceType} from './resource';
import {Constraint} from './constraint';
import {AllowedPermissions, mergeAllowedPermissions} from './allowed-permissions';
import {LinkType} from '../store/link-types/link.type';
import {Attribute, Collection} from '../store/collections/collection';
import {findAttribute} from '../store/collections/collection.util';

export interface QueryResource {
  resourceId: string;
  resourceIndex?: number;
  resourceType: AttributesResourceType;
}

export interface QueryAttribute extends QueryResource {
  attributeId: string;
  constraint?: Constraint;
}

export function cleanQueryAttribute(attribute: QueryAttribute): QueryAttribute {
  return {
    resourceIndex: attribute.resourceIndex,
    attributeId: attribute.attributeId,
    resourceId: attribute.resourceId,
    resourceType: attribute.resourceType,
  };
}

export function queryAttributePermissions(
  attribute: QueryAttribute,
  permissions: Record<string, AllowedPermissions>,
  linkTypesMap: Record<string, LinkType>
): AllowedPermissions {
  if (attribute.resourceType === AttributesResourceType.Collection) {
    return permissions[attribute.resourceId] && permissions[attribute.resourceId];
  }
  const linkType = linkTypesMap[attribute.resourceId];
  if (linkType) {
    return mergeAllowedPermissions(permissions[linkType.collectionIds[0]], permissions[linkType.collectionIds[1]]);
  }
  return {};
}

export function findResourceByQueryResource(
  attribute: QueryResource,
  collections: Collection[],
  linkTypes: LinkType[]
): AttributesResource {
  if (attribute?.resourceType === AttributesResourceType.Collection) {
    return (collections || []).find(coll => coll.id === attribute?.resourceId);
  } else if (attribute?.resourceType === AttributesResourceType.LinkType) {
    return (linkTypes || []).find(lt => lt.id === attribute?.resourceId);
  }

  return null;
}

export function findAttributeByQueryAttribute(
  attribute: QueryAttribute,
  collections: Collection[],
  linkTypes: LinkType[]
): Attribute {
  const resource = findResourceByQueryResource(attribute, collections, linkTypes);
  return findAttribute(resource?.attributes, attribute?.attributeId);
}

export function findConstraintByQueryAttribute(
  attribute: QueryAttribute,
  collections: Collection[],
  linkTypes: LinkType[]
): Constraint {
  return findAttributeByQueryAttribute(attribute, collections, linkTypes)?.constraint;
}
