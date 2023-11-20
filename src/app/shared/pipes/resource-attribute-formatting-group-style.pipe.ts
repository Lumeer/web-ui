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
import {AttributesResource, DataResource} from '../../core/model/resource';
import {ConstraintData, createDataValuesMap} from '@lumeer/data-filters';
import {AttributeFormattingStyle, computeAttributeFormatting} from '../utils/attribute.utils';
import {findAttribute} from '../../core/store/collections/collection.util';
import {objectsByIdMap} from '@lumeer/utils';

@Pipe({
  name: 'resourceAttributeFormattingStyle',
})
export class ResourceAttributeFormattingStylePipe implements PipeTransform {
  public transform(
    resource: AttributesResource,
    attributeId: string,
    dataResource: DataResource,
    constraintData: ConstraintData
  ): Partial<AttributeFormattingStyle> {
    const attribute = findAttribute(resource?.attributes, attributeId);
    if (dataResource?.id && attribute) {
      const dataValuesMap = createDataValuesMap(dataResource?.data, resource?.attributes, constraintData);
      const attributesMap = objectsByIdMap(resource.attributes);
      return computeAttributeFormatting(attribute, dataValuesMap, attributesMap, constraintData);
    }
    return {};
  }
}
