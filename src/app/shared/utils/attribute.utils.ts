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

import {Attribute} from '../../core/store/collections/collection';

export function findAttributeById(attributes: Attribute[], attributeId: string): Attribute {
  return attributes.find(attribute => attribute.id === attributeId);
}

export function findAttributeByName(attributes: Attribute[], name: string): Attribute {
  return attributes.find(attribute => attribute.name === name);
}

export function maxAttributeDepth(attributes: Attribute[]): number {
  return Math.max(...attributes.map(attribute => getAttributeDepth(attribute)));
}

export function filterAttributesByDepth(attributes: Attribute[], depth: number): Attribute[] {
  return attributes.filter(attribute => getAttributeDepth(attribute) === depth);
}

export function filterDirectAttributeChildren(attributes: Attribute[], parent: Attribute): Attribute[] {
  if (!parent) {
    return attributes.filter(attribute => getAttributeDepth(attribute) === 1);
  }

  return attributes.filter(attribute => isDirectAttributeChild(parent, attribute));
}

export function isDirectAttributeChild(parent: Attribute, potentialChild: Attribute): boolean {
  return (
    potentialChild.name.startsWith(parent.name) && getAttributeDepth(potentialChild) === getAttributeDepth(parent) + 1
  );
}

export function hasAttributeChildren(attributes: Attribute[], parent: Attribute): boolean {
  return attributes.some(attribute => isDirectAttributeChild(parent, attribute));
}

export function getAttributeDepth(attribute: Attribute): number {
  return attribute.name.split('.').length;
}

export function extractAttributeLastName(name: string): string {
  return splitAttributeName(name).lastName;
}

export function extractAttributeParentName(name: string): string {
  return splitAttributeName(name).parentName;
}

export function splitAttributeName(name: string): {parentName: string; lastName: string} {
  const parts = name.split('.');
  if (parts.length === 1) {
    return {parentName: null, lastName: name};
  }

  return {
    parentName: parts.slice(0, parts.length - 1).join('.'),
    lastName: parts[parts.length - 1],
  };
}

export function generateAttributeName(otherAttributes: Attribute[], parentName?: string): string {
  const existingNames = otherAttributes.map(attr => attr.name);
  const prefix = parentName ? `${parentName}.` : '';

  let lastName = 'A';
  while (existingNames.includes(prefix + lastName)) {
    lastName = increaseChar(lastName);
  }

  return prefix + lastName;
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
