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

import * as moment from 'moment';
import {formatUnknownDataValue, parseMomentDate} from '../../../shared/utils/data.utils';
import {getSmallestDateUnit, resetUnusedMomentPart} from '../../../shared/utils/date.utils';
import {DateTimeConstraintConfig} from '../data/constraint-config';
import {DataValue, DataValueInputType} from './index';

export class DateTimeDataValue implements DataValue {
  private readonly momentDate: moment.Moment;

  constructor(
    public readonly value: any,
    public readonly inputType: DataValueInputType,
    public readonly config: DateTimeConstraintConfig
  ) {
    if (this.value || this.value === 0) {
      this.momentDate = parseMomentDate(this.value, this.config && this.config.format);
    }
  }

  public serialize(): any {
    return this.momentDate ? this.momentDate.toISOString() : '';
  }

  public preview(): string {
    return this.format();
  }

  public format(showInvalid = true): string {
    if ([undefined, null, ''].includes(this.value)) {
      return '';
    }

    if (!this.isValidMomentDate()) {
      return showInvalid ? formatUnknownDataValue(this.value, true) : '';
    }

    return this.config && this.config.format
      ? this.momentDate.format(this.config.format)
      : formatUnknownDataValue(this.value);
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (!this.value && this.value !== 0) {
      return true;
    }

    if (!this.isValidMomentDate()) {
      return false;
    }

    return ignoreConfig || this.isWithinRange();
  }

  private isValidMomentDate(): boolean {
    return this.momentDate && this.momentDate.isValid();
  }

  private isWithinRange(): boolean {
    if (!this.config || !this.momentDate) {
      return true;
    }

    const {format, minValue, maxValue} = this.config;

    if (minValue) {
      const minDate = resetUnusedMomentPart(parseMomentDate(minValue, format), format);
      if (this.momentDate.diff(minDate) < 0) {
        return false;
      }
    }

    if (maxValue) {
      const maxDate = resetUnusedMomentPart(parseMomentDate(maxValue, format), format);
      if (this.momentDate.diff(maxDate) > 0) {
        return false;
      }
    }

    return true;
  }

  public increment(): DateTimeDataValue {
    const smallestUnit = getSmallestDateUnit(this.config.format);
    const nextValue = this.momentDate.add(1, smallestUnit).toISOString();
    return new DateTimeDataValue(nextValue, DataValueInputType.Stored, this.config);
  }

  public decrement(): DateTimeDataValue {
    const smallestUnit = getSmallestDateUnit(this.config.format);
    const nextValue = this.momentDate.subtract(1, smallestUnit).toISOString();
    return new DateTimeDataValue(nextValue, DataValueInputType.Stored, this.config);
  }

  public compareTo(otherValue: DateTimeDataValue): number {
    if (!this.momentDate || !otherValue.momentDate) {
      return this.momentDate ? 1 : -1;
    }

    return resetUnusedMomentPart(this.momentDate, this.config.format).diff(
      resetUnusedMomentPart(otherValue.momentDate, otherValue.config.format)
    );
  }

  public copy(newValue?: any): DateTimeDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new DateTimeDataValue(value, DataValueInputType.Copied, this.config);
  }

  public toDate(): Date {
    const value = this.serialize();
    return value ? new Date(value) : null;
  }

  public parseInput(inputValue: string): DateTimeDataValue {
    return new DateTimeDataValue(inputValue, DataValueInputType.Typed, this.config);
  }
}
