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

import Big from 'big.js';
import {compareBigNumbers} from '../../../shared/utils/big/compare-big-numbers';
import {
  convertToBig,
  decimalStoreToUser,
  decimalUserToStore,
  formatUnknownDataValue,
} from '../../../shared/utils/data.utils';
import {NumberConstraintConfig} from '../data/constraint-config';
import {NumericDataValue} from './index';
import {removeNonNumberCharacters} from '../../../shared/directives/number.directive';
import {escapeHtml, isNotNullOrUndefined, isNumeric, unescapeHtml} from '../../../shared/utils/common.utils';
import {QueryCondition, QueryConditionValue} from '../../store/navigation/query/query';
import {dataValuesMeetConditionByNumber, valueByConditionNumber, valueMeetFulltexts} from './data-value.utils';
import numbro from 'numbro';

export class NumberDataValue implements NumericDataValue {
  public readonly bigNumber: Big;

  constructor(
    public readonly value: any,
    public readonly config: NumberConstraintConfig,
    public readonly inputValue?: string
  ) {
    const unformatted = numbro.unformat(value, parseNumbroConfig(config));
    this.bigNumber = convertToBig(unformatted);
  }

  public format(overrideConfig?: Partial<NumberConstraintConfig>): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return removeNonNumberCharacters(this.inputValue);
    }

    if (this.bigNumber) {
      return numbro(this.bigNumber.toFixed()).format(parseNumbroConfig(this.config, overrideConfig));
    }

    return formatUnknownDataValue(this.value);
  }

  public preview(overrideConfig?: Partial<NumberConstraintConfig>): string {
    return this.format(overrideConfig);
  }

  public title(overrideConfig?: Partial<NumberConstraintConfig>): string {
    return unescapeHtml(this.format(overrideConfig));
  }

  public editValue(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return removeNonNumberCharacters(this.inputValue);
    }

    if (this.bigNumber) {
      return decimalStoreToUser(this.bigNumber.toFixed());
    }

    return unescapeHtml(formatUnknownDataValue(this.value));
  }

  public serialize(): any {
    if (this.bigNumber) {
      return this.bigNumber.toFixed();
    }
    return isNotNullOrUndefined(this.value) ? escapeHtml(decimalUserToStore(String(this.value).trim())) : null;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.copy(this.inputValue).isValid(ignoreConfig);
    }
    if (!this.value) {
      return true;
    }
    if (!this.bigNumber) {
      return false;
    }
    return Boolean(ignoreConfig) || checkNumberRange(this.bigNumber, this.config);
  }

  public increment(): NumberDataValue {
    return this.bigNumber && new NumberDataValue(this.bigNumber.add(1), this.config);
  }

  public decrement(): NumberDataValue {
    return this.bigNumber && new NumberDataValue(this.bigNumber.sub(1), this.config);
  }

  public compareTo(otherValue: NumberDataValue): number {
    return compareBigNumbers(this.bigNumber, otherValue.bigNumber);
  }

  public copy(newValue?: any): NumberDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new NumberDataValue(value, this.config);
  }

  public parseInput(inputValue: string): NumberDataValue {
    return new NumberDataValue(decimalUserToStore(inputValue), this.config, inputValue);
  }

  public meetCondition(condition: QueryCondition, values: QueryConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new NumberDataValue(value.value, this.config));
    const otherBigNumbers = dataValues.map(value => value.bigNumber);
    const otherValues = dataValues.map(value => value.value);

    return dataValuesMeetConditionByNumber(condition, this.bigNumber, otherBigNumbers, this.value, otherValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: QueryCondition, values: QueryConditionValue[]): any {
    return valueByConditionNumber(this, condition, values, '19');
  }
}

function parseNumbroConfig(
  config: NumberConstraintConfig,
  overrideConfig?: Partial<NumberConstraintConfig>
): numbro.Format {
  if (!config && !overrideConfig) {
    return {};
  }

  const numbroConfig: numbro.Format = {};
  if (overrideConfig?.forceSign || config.forceSign) {
    numbroConfig.forceSign = true;
  }
  if (overrideConfig?.separated || config.separated) {
    numbroConfig.thousandSeparated = true;
    numbroConfig.spaceSeparated = true;
  }
  if (overrideConfig?.compact || config.compact) {
    numbroConfig.average = true;
  }
  if (overrideConfig?.negative || config.negative) {
    numbroConfig.negative = 'parenthesis';
  }
  if (isNumeric(overrideConfig?.decimals || config.decimals)) {
    numbroConfig.mantissa = overrideConfig?.decimals || config.decimals;
    numbroConfig.trimMantissa = isNumeric(overrideConfig?.decimals);
  }
  return numbroConfig;
}

function checkNumberRange(n: Big, config?: NumberConstraintConfig): boolean {
  let passed = true;
  if (config && config.minValue) {
    passed = n.gte(config.minValue);
  }
  if (config && config.maxValue) {
    passed = passed && n.lte(config.maxValue);
  }

  return passed;
}
