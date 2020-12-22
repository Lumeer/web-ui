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
import {convertBigToNumberSafely} from '../../../shared/utils/big/convert-big-to-number-safely';
import {createBigWithoutTrailingZeros} from '../../../shared/utils/big/create-big-without-trailing-zeros';
import {escapeHtml, isNotNullOrUndefined, isNumeric, toNumber, unescapeHtml} from '../../../shared/utils/common.utils';
import {
  convertToBig,
  decimalStoreToUser,
  decimalUserToStore,
  formatUnknownDataValue,
} from '../../../shared/utils/data.utils';
import {PercentageConstraintConfig} from '../data/constraint-config';
import {NumericDataValue} from './index';
import {dataValuesMeetConditionByNumber, valueByConditionNumber, valueMeetFulltexts} from './data-value.utils';
import {ConditionType, ConditionValue} from '../attribute-filter';

export class PercentageDataValue implements NumericDataValue {
  public readonly bigNumber: Big;

  constructor(
    public readonly value: any,
    public readonly config: PercentageConstraintConfig,
    public readonly inputValue?: string
  ) {
    this.bigNumber = createPercentage(value, inputValue, config);
  }

  public format(overrideConfig?: Partial<PercentageConstraintConfig>, suffix: string = '%'): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }
    const bigNumber = overrideConfig
      ? createPercentage(this.value, this.inputValue, this.config, overrideConfig)
      : this.bigNumber;
    if (!bigNumber) {
      return formatUnknownDataValue(this.value);
    }

    return decimalStoreToUser(bigNumber.toString()) + suffix;
  }

  public preview(overrideConfig?: Partial<PercentageConstraintConfig>): string {
    return this.format(overrideConfig);
  }

  public title(overrideConfig?: Partial<PercentageConstraintConfig>): string {
    return unescapeHtml(this.format(overrideConfig));
  }

  public editValue(): string {
    return unescapeHtml(this.format(null, ''));
  }

  public serialize(): any {
    if (!this.bigNumber) {
      return this.value ? escapeHtml(String(this.value)) : '';
    }

    const decimals = this.config?.decimals || 0;
    return convertBigToNumberSafely(this.bigNumber.div(100), decimals + 2);
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.copy(this.inputValue).isValid(ignoreConfig);
    }

    if (!this.value) {
      return true;
    }

    return Boolean(this.bigNumber && (ignoreConfig || this.isPercentageWithinRange()));
  }

  private isPercentageWithinRange(): boolean {
    if (!this.config) {
      return true;
    }

    const {minValue, maxValue} = this.config;
    if ((minValue || minValue === 0) && this.compareTo(this.copy(minValue)) < 0) {
      return false;
    }
    return !((maxValue || maxValue === 0) && this.compareTo(this.copy(maxValue)) > 0);
  }

  public increment(): PercentageDataValue {
    return (
      (this.bigNumber && new PercentageDataValue(this.bigNumber.add(1).div(100).toFixed(), this.config)) || this.copy()
    );
  }

  public decrement(): PercentageDataValue {
    return (
      (this.bigNumber && new PercentageDataValue(this.bigNumber.sub(1).div(100).toFixed(), this.config)) || this.copy()
    );
  }

  public compareTo(otherValue: PercentageDataValue): number {
    return compareBigNumbers(this.bigNumber, otherValue.bigNumber);
  }

  public copy(newValue?: any): PercentageDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new PercentageDataValue(value, this.config);
  }

  public parseInput(inputValue: string): PercentageDataValue {
    return new PercentageDataValue(inputValue, this.config, inputValue);
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new PercentageDataValue(value.value, this.config));
    const otherBigNumbers = dataValues.map(value => value.bigNumber);
    const otherValues = dataValues.map(value => value.value);

    return dataValuesMeetConditionByNumber(condition, this.bigNumber, otherBigNumbers, this.value, otherValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    return valueByConditionNumber(this, condition, values, '0.19', 100);
  }
}

function parseInputValue(inputValue: string): string {
  const text = decimalUserToStore(String(inputValue).trim());
  if (text && text.endsWith('%')) {
    const prefix = text.slice(0, -1);
    if (isNumeric(prefix)) {
      return parseNumericPercentageInput(prefix, inputValue);
    }
  } else {
    if (text !== undefined && text.length === 0) {
      return '';
    }
    if (isNumeric(text)) {
      return parseNumericPercentageInput(text);
    }
  }

  return String(inputValue);
}

function parseNumericPercentageInput(value: string, defaultValue?: string): string {
  try {
    return createBigWithoutTrailingZeros(moveDecimalComma(toNumber(value), -2)).toString();
  } catch (e) {
    return defaultValue !== undefined ? defaultValue : value;
  }
}

function moveDecimalComma(value: any, offset: number): string {
  const big = new Big(value);
  big.e = big.e + offset;
  return big.toString();
}

function convertPercentageToBig(value: any, decimals?: number): Big {
  let big = convertToBig(value);
  if (!big) {
    return null;
  }

  big.e = big.e + 2;

  // prevents extra zeroes after moving the decimal point
  if (big.eq('0')) {
    big = new Big('0');
  }

  big = big.round(decimals || 0);

  return createBigWithoutTrailingZeros(big);
}

function createPercentage(
  value: any,
  inputValue: string,
  config: PercentageConstraintConfig,
  overrideConfig?: Partial<PercentageConstraintConfig>
): Big {
  const containerPercentageSign = String(value).trim().endsWith('%');
  const pureValue = containerPercentageSign || isNotNullOrUndefined(inputValue) ? parseInputValue(value) : value;
  return convertPercentageToBig(pureValue, overrideConfig?.decimals || config.decimals);
}
