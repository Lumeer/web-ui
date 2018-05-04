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

import {AttributeModel} from '../../core/store/collections/collection.model';

export function findAttributeById(attributes: AttributeModel[], attributeId: string): AttributeModel {
  return attributes.find(attribute => attribute.id === attributeId);
}

export function maxAttributeDepth(attributes: AttributeModel[]): number {
  return Math.max(...attributes.map(attribute => getAttributeDepth(attribute)));
}

export function filterAttributesByDepth(attributes: AttributeModel[], depth: number): AttributeModel[] {
  return attributes.filter(attribute => getAttributeDepth(attribute) === depth);
}

export function filterDirectAttributeChildren(attributes: AttributeModel[], parent: AttributeModel): AttributeModel[] {
  if (!parent) {
    return attributes.filter(attribute => getAttributeDepth(attribute) === 1);
  }

  return attributes.filter(attribute => isDirectAttributeChild(parent, attribute));
}

export function isDirectAttributeChild(parent: AttributeModel, potentialChild: AttributeModel): boolean {
  return potentialChild.name.startsWith(parent.name) && getAttributeDepth(potentialChild) === getAttributeDepth(parent) + 1;
}

export function hasAttributeChildren(attributes: AttributeModel[], parent: AttributeModel): boolean {
  return attributes.some(attribute => isDirectAttributeChild(parent, attribute));
}

export function getAttributeDepth(attribute: AttributeModel): number {
  return attribute.name.split('.').length;
}

export function extractAttributeName(attributeId: string): string {
  const {name} = splitAttributeId(attributeId);
  return name;
}

export function extractAttributeParentId(attributeId: string): string {
  const {parentId} = splitAttributeId(attributeId);
  return parentId;
}

export function splitAttributeId(attributeId: string): { parentId: string, name: string } {
  const parts = attributeId.split('.');
  if (parts.length === 1) {
    return {parentId: null, name: attributeId};
  }

  return {
    parentId: parts.slice(0, parts.length - 1).join('.'),
    name: parts[parts.length - 1]
  };
}

export function generateAttributeId(otherAttributes: AttributeModel[], parentId?: string): string {
  const existingIds = otherAttributes.map(attr => attr.id);
  const prefix = parentId ? `${parentId}.` : '';

  let name = 'A';
  while (existingIds.includes(prefix + name)) {
    name = increaseChar(name);
  }

  return prefix + name;
}

export function increaseChar(name: string): string {
  const lastIndex = name.length - 1;
  if (lastIndex < 0) {
    return 'A';
  }

  if (name[lastIndex] !== 'Z') {
    const nextChar = String.fromCharCode(name.charCodeAt(lastIndex) + 1);
    return name.substring(0, lastIndex).concat(nextChar);
  }

  return increaseChar(name.substring(0, lastIndex)) + 'A';
}
