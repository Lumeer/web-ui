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

import {Collection} from '../../core/store/collections/collection';
import {SelectItemModel} from './select-item/select-item.model';
import {LinkType} from '../../core/store/link-types/link.type';
import {AttributesResource, AttributesResourceType} from '../../core/model/resource';
import {getAttributesResourceType} from '../utils/resource.utils';
import {ConstraintType} from '@lumeer/data-filters';
import {Project} from '../../core/store/projects/project';

export function projectSelectItems(projects: Project[], id?: (Project) => any): SelectItemModel[] {
  return projects?.map(project => projectSelectItem(project, id)) || [];
}

export function projectSelectItem(project: Project, id?: (Project) => any): SelectItemModel {
  return {
    id: id?.(project) || project.id,
    value: project.code,
    icons: [project.icon],
    iconColors: [project.color],
  };
}

export function collectionSelectItems(collections: Collection[], id?: (Collection) => any): SelectItemModel[] {
  return collections?.map(collection => collectionSelectItem(collection, id)) || [];
}

export function collectionSelectItem(collection: Collection, id?: (Collection) => any): SelectItemModel {
  return {
    id: id?.(collection) || collection.id,
    value: collection.name,
    icons: [collection.icon],
    iconColors: [collection.color],
  };
}

export function linkTypesSelectItems(linkTypes: LinkType[], id?: any): SelectItemModel[] {
  return (
    linkTypes?.map(linkType => {
      return {
        id: id?.() || linkType.id,
        value: linkType.name,
        icons: [linkType.collections?.[0].icon, linkType.collections[1].icon],
        iconColors: [linkType.collections[0].color, linkType.collections[1].color],
      };
    }) || []
  );
}

export function resourceAttributesSelectItems(
  resource: AttributesResource,
  type?: ConstraintType,
  id?: (Attribute) => any
): SelectItemModel[] {
  const attributes = type
    ? resource?.attributes.filter(attribute => attribute.constraint?.type === type)
    : resource?.attributes;
  if (getAttributesResourceType(resource) === AttributesResourceType.Collection) {
    const collection = <Collection>resource;
    return (
      attributes
        ?.filter(attribute => !type || attribute?.constraint?.type === type)
        .map(attribute => {
          return {
            id: id?.(attribute) || attribute.id,
            value: attribute.name,
            icons: [collection.icon],
            iconColors: [collection.color],
          };
        }) || []
    );
  } else {
    const linkType = <LinkType>resource;
    return attributes?.map(attribute => {
      return {
        id: id?.(attribute) || attribute.id,
        value: attribute.name,
        icons: [linkType.collections?.[0].icon, linkType.collections[1].icon],
        iconColors: [linkType.collections[0].color, linkType.collections[1].color],
      };
    });
  }
}
