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
import {transformTextBasedOnCaseStyle} from '../../../shared/utils/string.utils';
import {TextConstraintConfig} from '../data/constraint-config';
import {DataValue} from './index';

export class TextDataValue implements DataValue {
  constructor(public readonly value: any, public readonly config: TextConstraintConfig) {}

  public format(): string {
    if (typeof this.value !== 'string') {
      return formatUnknownDataValue(this.value, true);
    }
    return transformTextBasedOnCaseStyle(this.value, this.config && this.config.caseStyle);
  }

  public serialize(): any {
    return this.format();
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (!this.value || ignoreConfig) {
      return true;
    }

    if (this.config) {
      if (this.config.minLength && ('' + this.value).length < this.config.minLength) {
        return false;
      }
      if (this.config.maxLength && ('' + this.value).length > this.config.maxLength) {
        return false;
      }
    }

    return true;
  }

  public increment(): TextDataValue {
    return undefined; // not supported
  }

  public decrement(): TextDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: TextDataValue): number {
    return String(this.value).localeCompare(String(otherValue.value));
  }

  public copy(newValue?: any): TextDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new TextDataValue(value, this.config);
  }

  public parseInput(inputValue: string): TextDataValue {
    return this.copy(inputValue);
  }
}
