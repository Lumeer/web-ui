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

import {Attribute} from '../../core/dto/attribute';
import {Collection} from '../../core/dto/collection';

export class AttributeHelper {
  public static generateAttributeId(attributeName: string): string {
    // TODO deal with existing same ID as well as invalid characters
    return attributeName;
  }

  public static generateAttributeName(otherAttributes: Attribute[]): string {
    const existingNames = otherAttributes.map(attr => attr.name);

    let name = 'A';
    while (existingNames.includes(name)) {
      name = AttributeHelper.increaseChar(name);
    }

    return name;
  }

  private static increaseChar(name: string): string {
    const lastIndex = name.length - 1;
    if (lastIndex < 0) {
      return 'A';
    }

    if (name[lastIndex] !== 'Z') {
      const nextChar = String.fromCharCode(name.charCodeAt(lastIndex) + 1);
      return name.substring(0, lastIndex).concat(nextChar);
    }

    return AttributeHelper.increaseChar(name.substring(0, lastIndex)) + 'A';
  }

  public static removeAttributeFromArray(attribute: Attribute, attributes: Attribute[]) {
    const index = attributes.indexOf(attribute);
    attributes.splice(index, 1);
  }

  public static getAttributesByPrefix(prefix: string, ...collections: Collection[]): [Collection, Attribute][] {
    return [].concat
      .apply([], collections.map(collection => collection.attributes.map(attribute => [collection, attribute])))
      .filter(([collection, attribute]: [Collection, Attribute]) =>
        attribute.name.toLowerCase().startsWith(prefix.toLowerCase())
      );
  }

  public static isAttributeInitialized(attribute: Attribute): boolean {
    return !!attribute.id;
  }
}
