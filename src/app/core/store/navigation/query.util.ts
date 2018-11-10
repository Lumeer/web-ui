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

import {AbstractControl, FormControl, FormGroup, Validators} from '@angular/forms';

import {ConditionType, QueryModel} from './query.model';
import {QueryItem} from '../../../shared/top-panel/search-box/query-item/model/query-item';
import {QueryItemType} from '../../../shared/top-panel/search-box/query-item/model/query-item-type';

const EqVariants = ['=', '==', 'eq', 'equals'];
const NeqVariants = ['!=', '!==', '<>', 'ne', 'neq', 'nequals'];
const LtVariants = ['<', 'lt'];
const LteVariants = ['<=', 'lte'];
const GtVariants = ['>', 'gt'];
const GteVariants = ['>=', 'gte'];

const allConditionArrays = [EqVariants, NeqVariants, LtVariants, LteVariants, GtVariants, GteVariants];

export function getAllConditions(): string[] {
  const maxElements = getMaxConditionsInArrays();

  const allConditions = [];
  for (let i = 0; i < maxElements; i++) {
    for (const array of allConditionArrays) {
      if (i < array.length) {
        allConditions.push(array[i]);
      }
    }
  }

  return allConditions;
}

function getMaxConditionsInArrays(): number {
  return allConditionArrays.reduce((acc, array) => {
    if (acc < array.length) {
      acc = array.length;
    }
    return acc;
  }, 0);
}

export function queryItemToForm(queryItem: QueryItem): AbstractControl {
  switch (queryItem.type) {
    case QueryItemType.View:
    case QueryItemType.Document:
    case QueryItemType.Collection:
    case QueryItemType.Link:
      return new FormGroup({
        value: new FormControl(queryItem.value, Validators.required),
        text: new FormControl(queryItem.text, Validators.required),
      });
    case QueryItemType.Deleted:
    case QueryItemType.Fulltext:
      return new FormGroup({
        value: new FormControl(queryItem.value, Validators.required),
      });
    case QueryItemType.Attribute:
      return new FormGroup({
        text: new FormControl(queryItem.text, Validators.required),
        condition: new FormControl(queryItem.condition, [Validators.required, conditionValidator]),
        conditionValue: new FormControl(queryItem.conditionValue, [Validators.required]),
      });
  }
}

export function conditionValidator(input: FormControl): {[key: string]: any} {
  const value = input.value.toString().trim();
  const isCondition = conditionFromString(value) != null;
  return !isCondition ? {invalidCondition: value} : null;
}

export function conditionFromString(condition: string): ConditionType {
  const conditionLowerCase = condition.toLowerCase();
  if (EqVariants.includes(conditionLowerCase)) {
    return ConditionType.Equals;
  } else if (NeqVariants.includes(conditionLowerCase)) {
    return ConditionType.NotEquals;
  } else if (LtVariants.includes(conditionLowerCase)) {
    return ConditionType.LowerThan;
  } else if (LteVariants.includes(conditionLowerCase)) {
    return ConditionType.LowerThanEquals;
  } else if (GtVariants.includes(conditionLowerCase)) {
    return ConditionType.GreaterThan;
  } else if (GteVariants.includes(conditionLowerCase)) {
    return ConditionType.GreaterThanEquals;
  }
  return null;
}

export function queryIsNotEmpty(query: QueryModel): boolean {
  return query && Object.values(query).find(val => (val instanceof Array ? val.length > 0 : val));
}

export function queryIsEmpty(query: QueryModel): boolean {
  return query && Object.values(query).every(val => (val instanceof Array ? val.length === 0 : !val));
}

export function isSingleCollectionQuery(query: QueryModel): boolean {
  return (
    query &&
    Object.entries(query).every(([key, value]) =>
      value instanceof Array ? (key === 'collectionIds' ? value.length > 0 : value.length === 0) : !value
    )
  );
}
