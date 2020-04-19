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

import {ConstraintData} from '../data/constraint';
import {ConstraintConfig} from '../data/constraint-config';
import {QueryCondition, QueryConditionValue} from '../../store/navigation/query/query';
import Big from 'big.js';

export interface DataValue {
  /**
   * Constraint definition based on which the value is formatted, serialized, checked for validity, etc.
   */
  config: Partial<ConstraintConfig>;

  /**
   * External data that is needed to format the value.
   */
  constraintData?: ConstraintData;

  /**
   * Raw value stored in the DB. Either serialized or entered by user before the constraint was used on the attribute.
   */
  value: any;

  /**
   * Raw value enter by user.
   */
  inputValue?: string;

  /**
   * Generates a string that will be shown to a user.
   *
   * @return stringified value or empty string if the value is `null` or `undefined`
   */
  format(): string;

  /**
   * Generates a shortened preview string that will be shown to a user.
   *
   * @return stringified value or empty string if the value is `null` or `undefined`
   */
  preview(): string;

  /**
   * Generates a title string that will be shown to a user.
   *
   * @return stringified value or empty string if the value is `null` or `undefined`
   */
  title(): string;

  /**
   * Generates a string that will be edited by user.
   *
   * @return stringified value or empty string if the value is `null` or `undefined`
   */
  editValue(): string;

  /**
   * Serializes the value to a format in which it is sent to backend and most probably also stored in the DB.
   */
  serialize(): any;

  /**
   * Checks if the value is valid based on constraint definition. It should return true for empty values.
   */
  isValid(ignoreConfig?: boolean): boolean;

  /**
   * Increments the value by the smallest possible unit based on the constraint.
   *
   * @return greater value, otherwise `null` if it does not exist or `undefined` if the operation is not supported
   */
  increment(): DataValue;

  /**
   * Decrements the value by the smallest possible unit based on the constraint.
   *
   * @return smaller value, otherwise `null` if it does not exist or `undefined` if the operation is not supported
   */
  decrement(): DataValue;

  /**
   * Compares this value to the other value.
   *
   * @return negative number if this value is less than the other value, positive number if this value is greater than
   * the other value or zero if the values are equal
   */
  compareTo(otherValue: DataValue): number;

  /**
   * Creates a copy of this data value either with the current value or a new value if provided.
   */
  copy(newValue?: any): DataValue;

  /**
   * Parses a text from a user input and creates a new value from it.
   */
  parseInput(inputValue: string): DataValue;

  /**
   * Check if the value meet specific condition and values
   */
  meetCondition(condition: QueryCondition, values: QueryConditionValue[]): boolean;

  /**
   * Check if the value meet all provided fulltexts
   */
  meetFullTexts(fulltexts: string[]): boolean;

  /**
   * Create value that meets condition
   */
  valueByCondition(condition: QueryCondition, values: QueryConditionValue[]): any;
}

export class DataValueAccumulator {
  constructor(public readonly count: number, public readonly result: DataValue) {}
}

export interface NumericDataValue extends DataValue {
  /**
   * Value stored as big number
   */
  bigNumber: Big;
}
