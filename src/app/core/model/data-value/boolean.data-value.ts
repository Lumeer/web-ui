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

import {BooleanConstraintConfig} from '../data/constraint-config';
import {DataValue} from './index';
import {valueByConditionText, valueMeetFulltexts} from './data-value.utils';
import {isArray, unescapeHtml} from '../../../shared/utils/common.utils';
import {ConditionType, ConditionValue} from '../attribute-filter';

const truthyValues = [true, 'true', 'yes', 'ja', 'ano', 'áno', 'sí', 'si', 'sim', 'да', '是', 'はい', 'vâng', 'כן'];

export class BooleanDataValue implements DataValue {
  public readonly config: BooleanConstraintConfig = {};
  public readonly booleanValue: boolean;

  constructor(public readonly value: any) {
    this.value = isArray(value) ? value.every(val => !!val) : value;
    this.booleanValue = truthyValues.includes(
      typeof this.value === 'string' ? this.value.toLocaleLowerCase() : this.value
    );
  }

  public format(): string {
    return String(this.booleanValue); // TODO format based on language
  }

  public preview(): string {
    return this.format();
  }

  public title(): string {
    return this.format();
  }

  public editValue(): string {
    return this.format();
  }

  public serialize(): any {
    return this.booleanValue;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return true; // any value can be converted to boolean
  }

  public decrement(): BooleanDataValue {
    return undefined; // not supported
  }

  public increment(): BooleanDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: BooleanDataValue): number {
    if (this.booleanValue === otherValue.booleanValue) {
      return 0;
    }

    return this.booleanValue ? 1 : -1;
  }

  public copy(newValue?: any): BooleanDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new BooleanDataValue(value);
  }

  public parseInput(inputValue: string): BooleanDataValue {
    return new BooleanDataValue(inputValue);
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new BooleanDataValue(value.value));
    const otherBooleanValue = dataValues.length > 0 && dataValues[0].booleanValue;
    switch (condition) {
      case ConditionType.Equals:
        return this.booleanValue === otherBooleanValue;
      case ConditionType.NotEquals:
        return this.booleanValue !== otherBooleanValue;
      default:
        return false;
    }
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    switch (condition) {
      case ConditionType.Equals:
        return values[0].value;
      case ConditionType.NotEquals:
        return !values[0].value;
      default:
        return null;
    }
  }
}
