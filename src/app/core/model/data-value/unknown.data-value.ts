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
import {DataValue, DataValueInputType} from './index';

export class UnknownDataValue implements DataValue {
  public readonly config: any = {};

  constructor(public readonly value: any, public readonly inputType: DataValueInputType) {}

  public format(): string {
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
    return new UnknownDataValue(value, DataValueInputType.Copied);
  }

  public parseInput(inputValue: string): DataValue {
    return new UnknownDataValue(inputValue, DataValueInputType.Typed);
  }
}
