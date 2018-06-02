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

export interface QueryModel {

  collectionIds?: string[];
  documentIds?: string[];
  filters?: string[];
  fulltext?: string;
  linkTypeIds?: string[];
  page?: number;
  pageSize?: number;

  and?: QueryModel[];
  or?: QueryModel[];
  not?: QueryModel;

}

export interface AttributeFilter {
  collectionId: string;
  conditionType: ConditionType;
  attributeId: string;
  value: any;
}

export enum ConditionType {
  Equals,
  NotEquals,
  LowerThan,
  LowerThanEquals,
  GreaterThan,
  GreaterThanEquals
}

const EqVariants = ['=', '==', 'eq', 'equals'];
const NeqVariants = ['!=', '!==', '<>', 'ne', 'neq', 'nequals'];
const LtVariants = ['<', 'lt'];
const LteVariants = ['<=', 'lte'];
const GtVariants = ['>', 'gt'];
const GteVariants = ['>=', 'gte'];

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
