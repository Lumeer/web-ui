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

import {UnknownConstraint} from '../../../core/model/constraint/unknown.constraint';
import {ConstraintData} from '../../../core/model/data/constraint';
import {Attribute} from '../../../core/store/collections/collection';
import {DocumentData} from '../../../core/store/documents/document.model';
import {DataValueInputType} from '../../../core/model/data-value';

export function formatData(
  data: DocumentData,
  attributes: Attribute[],
  constraintData: ConstraintData,
  filterInvalid?: boolean
): DocumentData {
  const idsMap: Record<string, Attribute> = (attributes || []).reduce((attributesMap, attr) => {
    attributesMap[attr.id] = attr;
    return attributesMap;
  }, {});
  const newData = {};
  for (const [attributeId, attribute] of Object.entries(idsMap)) {
    const constraint = attribute.constraint || new UnknownConstraint();
    const dataValue = constraint.createDataValue(data[attributeId], DataValueInputType.Stored, constraintData);
    if (!filterInvalid || dataValue.isValid(true)) {
      newData[attributeId] = dataValue.format();
    }
  }
  return newData;
}
