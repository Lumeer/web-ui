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

import {
  BooleanConstraint,
  Constraint,
  ConstraintData,
  ConstraintType,
  SelectConstraint,
  SelectConstraintConfig,
  SelectConstraintOption,
  UnknownConstraint,
  UserConstraint,
  UserConstraintConfig,
  UserDataValue,
  ViewConstraint,
  ViewConstraintConfig,
} from '@lumeer/data-filters';

import {DataResource} from '../../core/model/resource';
import {Attribute} from '../../core/store/collections/collection';
import {findAttributeConstraint} from '../../core/store/collections/collection.util';
import {createSuggestionDataValues} from '../utils/data-resource.utils';

@Pipe({
  name: 'stateListConstraint',
})
export class StateListConstraintPipe implements PipeTransform {
  public transform(
    attributes: Attribute[],
    attributeId: string,
    dataResources: DataResource[],
    constraintData: ConstraintData
  ): {constraint: Constraint; constraintData: ConstraintData} {
    if (!attributeId) {
      return null;
    }
    const constraint = findAttributeConstraint(attributes, attributeId) || new UnknownConstraint();
    if (constraint?.type === ConstraintType.View) {
      const viewConfig = <ViewConstraintConfig>{...constraint.config, multi: true};
      return {constraint: new ViewConstraint(viewConfig), constraintData};
    } else if (constraint?.type === ConstraintType.Select) {
      const selectConfig = <SelectConstraintConfig>{...constraint.config, multi: true};
      return {constraint: new SelectConstraint(selectConfig), constraintData};
    } else if (constraint?.type === ConstraintType.User) {
      const userConfig = <UserConstraintConfig>{...constraint.config, multi: true};
      const userDataValues = createSuggestionDataValues<UserDataValue>(
        dataResources,
        attributeId,
        constraint,
        constraintData
      );
      const users = [...(constraintData?.users || [])];
      userDataValues.forEach(dataValue => {
        users.push(...(dataValue?.users || []).filter(user => !users.some(u => u.email === user.email)));
      });

      return {constraint: new UserConstraint(userConfig), constraintData: {...constraintData, users}};
    } else if (constraint?.type === ConstraintType.Boolean) {
      return {constraint: new BooleanConstraint(), constraintData};
    }

    const options: SelectConstraintOption[] = createSuggestionDataValues(
      dataResources,
      attributeId,
      constraint,
      constraintData
    ).map(value => ({
      value: value.serialize(),
      displayValue: value.format(),
    }));

    return {constraint: new SelectConstraint({displayValues: true, multi: true, options}), constraintData};
  }
}
