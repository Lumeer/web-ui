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
import {ConstraintType, SelectConstraintConfig} from '@lumeer/data-filters';

import {Attribute, Collection} from '../../../../core/store/collections/collection';
import {LinkType} from '../../../../core/store/link-types/link.type';
import {SelectionList} from '../selection-list';

export interface AttributeSelectionList extends SelectionList {
  icons: string[];
  colors: string[];
  shortName: string;
}

export function collectionAttributeCustomSelectionLists(collection: Collection): AttributeSelectionList[] {
  return (collection?.attributes || []).reduce((lists, attribute) => {
    const customSelectionList = collectionAttributeCustomSelectionList(collection, attribute);
    if (customSelectionList) {
      lists.push(customSelectionList);
    }
    return lists;
  }, []);
}

export function linkTypeAttributeCustomSelectionLists(linkType: LinkType): AttributeSelectionList[] {
  return (linkType?.attributes || []).reduce((lists, attribute) => {
    const customSelectionList = linkTypeAttributeCustomSelectionList(linkType, attribute);
    if (customSelectionList) {
      lists.push(customSelectionList);
    }
    return lists;
  }, []);
}

function collectionAttributeCustomSelectionList(collection: Collection, attribute: Attribute): AttributeSelectionList {
  if (attribute.constraint?.type === ConstraintType.Select) {
    const config = attribute.constraint.config as SelectConstraintConfig;
    if (config && !config.selectionListId && config.options?.length > 0) {
      return {
        id: `${collection.id}:${attribute.id}`,
        name: `${collection.name}.${attribute.name}`,
        displayValues: config.displayValues,
        options: config.options,
        icons: [collection.icon],
        colors: [collection.color],
        shortName: attribute.name,
      };
    }
  }
  return null;
}

function linkTypeAttributeCustomSelectionList(linkType: LinkType, attribute: Attribute): AttributeSelectionList {
  if (attribute.constraint?.type === ConstraintType.Select) {
    const config = attribute.constraint.config as SelectConstraintConfig;
    if (config && !config.selectionListId && config.options?.length > 0) {
      return {
        id: `${linkType.id}:${attribute.id}`,
        name: `${linkType.name}.${attribute.name}`,
        displayValues: config.displayValues,
        options: config.options,
        icons: linkType.collections?.map(collection => collection.icon),
        colors: linkType.collections?.map(collection => collection.color),
        shortName: attribute.name,
      };
    }
  }
  return null;
}
