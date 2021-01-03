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
import {Constraint} from '../../../../../../../../core/model/constraint';
import {Attribute} from '../../../../../../../../core/store/collections/collection';
import {findAttributeConstraint} from '../../../../../../../../core/store/collections/collection.util';
import {ConstraintData, ConstraintType} from '../../../../../../../../core/model/data/constraint';
import {
  SelectConstraintConfig,
  SelectConstraintOption,
  UserConstraintConfig,
} from '../../../../../../../../core/model/data/constraint-config';
import {SelectConstraint} from '../../../../../../../../core/model/constraint/select.constraint';
import {DocumentModel} from '../../../../../../../../core/store/documents/document.model';
import {uniqueValues} from '../../../../../../../../shared/utils/array.utils';
import {UnknownConstraint} from '../../../../../../../../core/model/constraint/unknown.constraint';
import {isArray} from '../../../../../../../../shared/utils/common.utils';
import {UserConstraint} from '../../../../../../../../core/model/constraint/user.constraint';
import {DataValue} from '../../../../../../../../core/model/data-value';
import {UserDataValue} from '../../../../../../../../core/model/data-value/user.data-value';
import {BooleanConstraint} from '../../../../../../../../core/model/constraint/boolean.constraint';

@Pipe({
  name: 'stateListConstraint',
})
export class StateListConstraintPipe implements PipeTransform {
  public transform(
    attributes: Attribute[],
    attributeId: string,
    documents: DocumentModel[],
    constraintData: ConstraintData
  ): {constraint: Constraint; constraintData: ConstraintData} {
    if (!attributeId) {
      return null;
    }
    const constraint = findAttributeConstraint(attributes, attributeId) || new UnknownConstraint();
    if (constraint?.type === ConstraintType.Select) {
      const selectConfig = <SelectConstraintConfig>{...constraint.config, multi: true};
      return {constraint: new SelectConstraint(selectConfig), constraintData};
    } else if (constraint?.type === ConstraintType.User) {
      const userConfig = <UserConstraintConfig>{...constraint.config, multi: true};
      const userDataValues = createDataValues<UserDataValue>(documents, attributeId, constraint, constraintData, true);
      const users = [...(constraintData?.users || [])];
      userDataValues.forEach(dataValue => {
        users.push(...(dataValue?.users || []).filter(user => !users.some(u => u.email === user.email)));
      });

      return {constraint: new UserConstraint(userConfig), constraintData: {...constraintData, users}};
    } else if (constraint?.type === ConstraintType.Boolean) {
      return {constraint: new BooleanConstraint(), constraintData};
    }

    const dataValues = createDataValues(documents, attributeId, constraint, constraintData, true);

    const options: SelectConstraintOption[] = dataValues
      .map(value => ({
        value: value.serialize(),
        displayValue: value.format(),
      }))
      .filter(option => !!option.displayValue);

    return {constraint: new SelectConstraint({displayValues: true, multi: true, options}), constraintData};
  }
}

function createDataValues<T extends DataValue>(
  documents: DocumentModel[],
  attributeId: string,
  constraint: Constraint,
  constraintData: ConstraintData,
  flatten: boolean
): T[] {
  const values = documents.reduce((data, document) => {
    const value = document.data?.[attributeId];
    if (flatten && isArray(value)) {
      data.push(...value);
    } else {
      data.push(value);
    }
    return data;
  }, []);

  return uniqueValues(values).map(value => <T>constraint.createDataValue(value, constraintData));
}
