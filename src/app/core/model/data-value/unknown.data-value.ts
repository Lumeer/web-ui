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

import {formatUnknownDataValue} from '../../../shared/utils/data.utils';
import {DataValue} from './index';
import {isNotNullOrUndefined} from '../../../shared/utils/common.utils';
import {QueryCondition, QueryConditionValue} from '../../store/navigation/query/query';
import {dataValuesMeetConditionByText, dataValuesMeetFulltexts} from './data-value.utils';

export class UnknownDataValue implements DataValue {
  public readonly config: any = {};

  constructor(public readonly value: any, public readonly inputValue?: string) {}

  public format(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }
    return formatUnknownDataValue(this.value);
  }

  public preview(): string {
    return this.format();
  }

  public serialize(): any {
    return this.value;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return true;
  }

  public increment(): DataValue {
    return undefined; // not supported
  }

  public decrement(): DataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: DataValue): number {
    if (typeof this.value === 'number' && typeof otherValue.value === 'number') {
      return this.value - otherValue.value;
    }

    return String(this.value).localeCompare(String(otherValue.value));
  }

  public copy(newValue?: any): DataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new UnknownDataValue(value);
  }

  public parseInput(inputValue: string): DataValue {
    return new UnknownDataValue(inputValue);
  }

  public meetCondition(condition: QueryCondition, values: QueryConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new UnknownDataValue(value.value));
    const formattedValue = this.format()
      .toLowerCase()
      .trim();
    const otherFormattedValues = dataValues.map(dataValue =>
      dataValue
        .format()
        .toLowerCase()
        .trim()
    );
    return dataValuesMeetConditionByText(condition, formattedValue, otherFormattedValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return dataValuesMeetFulltexts(this.format(), fulltexts);
  }
}
