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
import {
  convertToBig,
  formatDurationDataValue,
  getDurationSaveValue,
  isDurationDataValueValid,
} from '../../../shared/utils/constraint/duration-constraint.utils';
import {formatUnknownDataValue} from '../../../shared/utils/data.utils';
import {ConstraintData} from '../data/constraint';
import {DurationConstraintConfig} from '../data/constraint-config';
import {DataValue} from './index';
import {isNotNullOrUndefined, isNumeric, toNumber} from '../../../shared/utils/common.utils';

export class DurationDataValue implements DataValue {
  public bigNumber: Big;

  constructor(
    public readonly value: any,
    public readonly config: DurationConstraintConfig,
    public readonly constraintData: ConstraintData,
    public readonly inputValue?: string,
  ) {
    const durationUnitsMap = this.constraintData && this.constraintData.durationUnitsMap;
    if (isDurationDataValueValid(value, durationUnitsMap)) {
      this.bigNumber = convertToBig(getDurationSaveValue(value, this.config, durationUnitsMap));
    }
  }

  public format(maxUnits?: number): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if (!this.bigNumber) {
      return formatUnknownDataValue(this.value);
    }

    // TODO optimize
    return formatDurationDataValue(
      this.value,
      this.config,
      this.constraintData && this.constraintData.durationUnitsMap,
      maxUnits
    );
  }

  public preview(): string {
    return this.format();
  }

  public serialize(): any {
    if (!this.bigNumber) {
      return formatUnknownDataValue(this.value);
    }

    return convertBigToNumberSafely(this.bigNumber);
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.copy(this.inputValue).isValid(ignoreConfig);
    }
    return !!this.bigNumber;
  }

  public increment(): DurationDataValue {
    // TODO increment by smallest used unit
    return this.bigNumber && this.copy(this.bigNumber.add(1));
  }

  public decrement(): DurationDataValue {
    // TODO decrement by smallest used unit
    return this.bigNumber && this.copy(this.bigNumber.sub(1));
  }

  public compareTo(otherValue: DurationDataValue): number {
    return compareBigNumbers(this.bigNumber, otherValue.bigNumber);
  }

  public copy(newValue?: any): DurationDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new DurationDataValue(value, this.config, this.constraintData);
  }

  public parseInput(inputValue: string): DurationDataValue {
    return new DurationDataValue(inputValue, this.config, this.constraintData, inputValue);
  }
}

function parseInputValue(value: any): any {
  if (isNumeric(value)) {
    return toNumber(value) * 1000;
  }
  return value;
}
