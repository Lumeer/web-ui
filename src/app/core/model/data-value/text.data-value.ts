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

import {formatUnknownDataValue, stripTextHtmlTags} from '../../../shared/utils/data.utils';
import {transformTextBasedOnCaseStyle} from '../../../shared/utils/string.utils';
import {TextConstraintConfig} from '../data/constraint-config';
import {DataValue} from './index';
import {isNotNullOrUndefined} from '../../../shared/utils/common.utils';

export class TextDataValue implements DataValue {
  constructor(
    public readonly value: any,
    public readonly config: TextConstraintConfig,
    public readonly inputValue?: string,
  ) {}

  public format(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if (typeof this.value !== 'string') {
      return formatUnknownDataValue(this.value, true);
    }
    return transformTextBasedOnCaseStyle(this.value, this.config && this.config.caseStyle);
  }

  public preview(): string {
    return stripTextHtmlTags(this.format());
  }

  public serialize(): any {
    const formattedValue = this.format();
    if (numberOfTags(formattedValue) === 1) {
      return stripTextHtmlTags(formattedValue, false);
    }
    return formattedValue;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.copy(this.inputValue).isValid(ignoreConfig);
    }

    if (!this.value || ignoreConfig) {
      return true;
    }

    if (this.config) {
      const strippedValue = stripTextHtmlTags(this.value, false);
      if (this.config.minLength && strippedValue.length < this.config.minLength) {
        return false;
      }
      if (this.config.maxLength && strippedValue.length > this.config.maxLength) {
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
    return new TextDataValue(inputValue, this.config, inputValue);
  }
}

function numberOfTags(value: string): number {
  const match = value.match(/<([a-z]+)(?=[\s>])(?:[^>=]|='[^']*'|="[^"]*"|=[^'"\s]*)*\s?\/?>/g);
  return match ? match.length : 0;
}
