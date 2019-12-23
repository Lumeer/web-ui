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
import {DataValue} from './index';
import {removeNonNumberCharacters} from '../../../shared/directives/number.directive';
import {isNotNullOrUndefined} from '../../../shared/utils/common.utils';

export class NumberDataValue implements DataValue {
  public readonly bigNumber: Big;

  constructor(
    public readonly value: any,
    public readonly config: NumberConstraintConfig,
    public readonly inputValue?: string
  ) {
    this.bigNumber = convertToBig(value);
  }

  public format(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return removeNonNumberCharacters(this.inputValue);
    }
    // TODO format based on config
    return this.bigNumber ? decimalStoreToUser(this.bigNumber.toFixed()) : formatUnknownDataValue(this.value);
  }

  public preview(): string {
    return this.format();
  }

  public serialize(): any {
    return decimalUserToStore(String(this.value).trim());
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
    return new NumberDataValue(inputValue, this.config, inputValue);
  }
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
