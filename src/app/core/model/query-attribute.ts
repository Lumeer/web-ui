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

import {AttributesResourceType} from './resource';
import {Constraint} from './constraint';
import {AllowedPermissions, mergeAllowedPermissions} from './allowed-permissions';
import {LinkType} from '../store/link-types/link.type';

export interface QueryAttribute {
  resourceId: string;
  attributeId: string;
  resourceIndex?: number;
  resourceType: AttributesResourceType;
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
