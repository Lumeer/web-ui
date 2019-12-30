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
import {isNotNullOrUndefined, isNumeric, toNumber} from '../../../shared/utils/common.utils';
import {
  convertToBig,
  decimalStoreToUser,
  decimalUserToStore,
  formatUnknownDataValue,
} from '../../../shared/utils/data.utils';
import {PercentageConstraintConfig} from '../data/constraint-config';
import {DataValue} from './index';
import {QueryCondition, QueryConditionValue} from '../../store/navigation/query/query';
import {dataValuesMeetConditionByNumber, dataValuesMeetFulltexts} from './data-value.utils';

export class PercentageDataValue implements DataValue {
  public readonly percentage: Big;

  constructor(
    public readonly value: any,
    public readonly config: PercentageConstraintConfig,
    public readonly inputValue?: string
  ) {
    this.percentage = this.createPercentage(value);
  }

  private createPercentage(value: any): Big {
    const containerPercentageSign = String(value)
      .trim()
      .endsWith('%');
    const pureValue = containerPercentageSign || isNotNullOrUndefined(this.inputValue) ? parseInputValue(value) : value;
    return convertPercentageToBig(pureValue, this.config && this.config.decimals);
  }

  public format(suffix = '%'): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }
    if (!this.percentage) {
      return formatUnknownDataValue(this.value);
    }

    return decimalStoreToUser(this.percentage.toString()) + suffix;
  }

  public preview(): string {
    return this.format();
  }

  public serialize(): any {
    if (!this.percentage) {
      return this.value ? String(this.value) : '';
    }

    const decimals = (this.config && this.config.decimals) || 0;
    return convertBigToNumberSafely(this.percentage.div(100), decimals + 2);
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.copy(this.inputValue).isValid(ignoreConfig);
    }

    if (!this.value) {
      return true;
    }

    return Boolean(this.percentage && (ignoreConfig || this.isPercentageWithinRange()));
  }

  private isPercentageWithinRange(): boolean {
    if (!this.config) {
      return true;
    }

    const {minValue, maxValue} = this.config;
    if ((minValue || minValue === 0) && this.compareTo(this.copy(minValue / 100)) < 0) {
      return false;
    }
    return !((maxValue || maxValue === 0) && this.compareTo(this.copy(maxValue / 100)) > 0);
  }

  public increment(): PercentageDataValue {
    return this.percentage && new PercentageDataValue(this.percentage.add(1), this.config);
  }

  public decrement(): PercentageDataValue {
    return this.percentage && new PercentageDataValue(this.percentage.sub(1), this.config);
  }

  public compareTo(otherValue: PercentageDataValue): number {
    return compareBigNumbers(this.percentage, otherValue.percentage);
  }

  public copy(newValue?: any): PercentageDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new PercentageDataValue(value, this.config);
  }

  public parseInput(inputValue: string): PercentageDataValue {
    return new PercentageDataValue(inputValue, this.config, inputValue);
  }

  public meetCondition(condition: QueryCondition, values: QueryConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new PercentageDataValue(value.value, this.config));
    const otherBigNumbers = dataValues.map(value => value.percentage);
    const otherValues = dataValues.map(value => value.value);

    return dataValuesMeetConditionByNumber(condition, this.percentage, otherBigNumbers, this.value, otherValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return dataValuesMeetFulltexts(this.format(), fulltexts);
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
