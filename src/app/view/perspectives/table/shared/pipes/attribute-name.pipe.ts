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

import {Pipe, PipeTransform} from '@angular/core';
import {Attribute} from '../../../../../core/store/collections/collection';
import {extractAttributeParentName} from '../../../../../shared/utils/attribute.utils';

@Pipe({
  name: 'attributeName',
})
export class AttributeNamePipe implements PipeTransform {
  public transform(attribute: Attribute, newLastName: string): any {
    if (!attribute) {
      return '';
    }

    const parentName = extractAttributeParentName(attribute.name);
    if (parentName) {
      return `${parentName}.${newLastName}`;
    }

    return newLastName;
  }
}
