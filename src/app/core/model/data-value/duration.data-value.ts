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
  createDurationUnitsCountsMap,
  formatDurationDataValue,
  getDurationSaveValue,
  getDurationUnitToMillisMap,
  isDurationDataValueValid,
  sortedDurationUnits,
} from '../../../shared/utils/constraint/duration-constraint.utils';
import {formatUnknownDataValue} from '../../../shared/utils/data.utils';
import {ConstraintData, DurationUnitsMap} from '../data/constraint';
import {DurationConstraintConfig, DurationUnit} from '../data/constraint-config';
import {NumericDataValue} from './index';
import {isNotNullOrUndefined, isNumeric, toNumber} from '../../../shared/utils/common.utils';
import {QueryCondition, QueryConditionValue} from '../../store/navigation/query/query';
import {dataValuesMeetConditionByNumber, valueByConditionNumber, valueMeetFulltexts} from './data-value.utils';

export class DurationDataValue implements NumericDataValue {
  public bigNumber: Big;
  public unitsCountMap: Record<DurationUnit, number>;

  constructor(
    public readonly value: any,
    public readonly config: DurationConstraintConfig,
    public readonly constraintData: ConstraintData,
    public readonly inputValue?: string
  ) {
    const durationUnitsMap = this.constraintData && this.constraintData.durationUnitsMap;
    const modifiedValue = this.inputValue ? parseInputValue(this.inputValue) : value;
    if (isDurationDataValueValid(value, durationUnitsMap)) {
      const saveValue = getDurationSaveValue(modifiedValue, this.config, durationUnitsMap);
      this.bigNumber = convertToBig(saveValue);
      this.unitsCountMap = createDurationUnitsCountsMap(saveValue, this.config);
    }
  }

  public format(maxUnits?: number): string {
    return this.formatWithUnitsMap(this.constraintData && this.constraintData.durationUnitsMap, maxUnits);
  }

  private formatToNativeLocale(): string {
    return this.formatWithUnitsMap();
  }

  private formatWithUnitsMap(durationUnitsMap?: DurationUnitsMap, maxUnits?: number) {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if (!this.bigNumber) {
      return formatUnknownDataValue(this.value);
    }

    return formatDurationDataValue(this.value, this.config, durationUnitsMap, maxUnits);
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
    return this.addToSmallestUnit();
  }

  private addToSmallestUnit(multiplier: 1 | -1 = 1): DurationDataValue {
    const one = new Big(1);
    if (this.bigNumber) {
      const formatted = this.formatToNativeLocale();
      const unitsMap = getDurationUnitToMillisMap(this.config);
      for (let i = sortedDurationUnits.length - 1; i >= 0; i--) {
        if (formatted.includes(sortedDurationUnits[i])) {
          const millis = unitsMap[sortedDurationUnits[i]] || 1;
          if (this.bigNumber.div(new Big(millis)).gte(one)) {
            return this.copy(this.bigNumber.add(millis * multiplier).toFixed());
          }
        }
      }
    }
    return this.copy();
  }

  public decrement(): DurationDataValue {
    return this.addToSmallestUnit(-1);
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

  public meetCondition(condition: QueryCondition, values: QueryConditionValue[]): boolean {
    const dataValues = (values || []).map(
      value => new DurationDataValue(value.value, this.config, this.constraintData)
    );
    const otherBigNumbers = dataValues.map(value => value.bigNumber);
    const otherValues = dataValues.map(value => value.value);

    return dataValuesMeetConditionByNumber(condition, this.bigNumber, otherBigNumbers, this.value, otherValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: QueryCondition, values: QueryConditionValue[]): any {
    return valueByConditionNumber(this, condition, values, '19s');
  }
}

function parseInputValue(value: any): any {
  if (isNumeric(value)) {
    return toNumber(value) * 1000;
  }
  return value;
}
