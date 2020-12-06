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

import {DataValue} from '../data-value';
import {ConstraintData, ConstraintType} from '../data/constraint';
import {ConstraintConfig} from '../data/constraint-config';
import {ConditionType} from '../attribute-filter';

export interface Constraint {
  /**
   * Type of this constraint
   */
  type: ConstraintType;

  /**
   * Config used for data value formatting, serialization, validation, etc.
   */
  config: Partial<ConstraintConfig>;

  /**
   * Determine if constraint is visualized simply by text in readonly mode.
   */
  isTextRepresentation: boolean;

  /**
   * Determine if constraint can be edited directly (i.e. on simple click).
   */
  isDirectlyEditable?: boolean;

  /**
   * Creates data value based on this constraint.
   */
  createDataValue(value: any, constraintData?: ConstraintData): DataValue;

  /**
   * Creates data value based on this constraint.
   */
  createInputDataValue(inputValue: string, value: any, constraintData?: ConstraintData): DataValue;

  /**
   * Calculates a sum of the given values.
   */
  sum(values: any[], onlyNumeric?: boolean): any;

  /**
   * Calculates an average of the given values.
   */
  avg(values: any[], onlyNumeric?: boolean): any;

  /**
   * Calculates a minimum of the given values.
   */
  min(values: any[], onlyNumeric?: boolean): any;

  /**
   * Calculates a maximum of the given values.
   */
  max(values: any[], onlyNumeric?: boolean): any;

  /**
   * Calculates a median of the given values.
   */
  median(values: any[], onlyNumeric?: boolean): any;

  /**
   * Calculates a median of the given values.
   */
  median(values: any[], onlyNumeric?: boolean): any;

  /**
   * Calculates a count of the given values.
   */
  count(values: any[]): number;

  /**
   * Calculates a unique count of the given values.
   */
  unique(values: any[]): number;

  /**
   * Supported conditions
   */
  conditions(): ConditionType[];
}
