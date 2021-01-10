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
import {formatUnknownDataValue} from '../../../shared/utils/data.utils';
import {getSmallestDateUnit, parseMomentDate, resetUnusedMomentPart, resetWeek} from '../../../shared/utils/date.utils';
import {DateTimeConstraintConfig} from '../data/constraint-config';
import {DataValue} from './index';
import {isDateValid, isNotNullOrUndefined, isNullOrUndefined, unescapeHtml} from '../../../shared/utils/common.utils';
import {ConstraintConditionValue, DateTimeConstraintConditionValue} from '../data/constraint-condition';
import {valueMeetFulltexts} from './data-value.utils';
import {createRange} from '../../../shared/utils/array.utils';
import {conditionNumInputs} from '../../store/navigation/query/query.util';
import {ConditionType, ConditionValue} from '../attribute-filter';

export class DateTimeDataValue implements DataValue {
  public readonly momentDate: moment.Moment;

  constructor(
    public readonly value: any,
    public readonly config: DateTimeConstraintConfig,
    public readonly inputValue?: string
  ) {
    if (inputValue) {
      this.momentDate = parseMomentDate(this.value, this.config?.format);
    } else if (isDateValid(this.value)) {
      this.momentDate = moment(this.value);
      this.value = this.value.getTime();
    } else if (this.value) {
      this.momentDate = isISOFormat(this.value) ? moment(this.value) : parseMomentDate(this.value, this.config?.format);
    }

    this.momentDate = this.momentDate?.isValid()
      ? resetUnusedMomentPart(this.momentDate, this.config?.format)
      : this.momentDate;
  }

  public serialize(): any {
    return this.momentDate ? this.momentDate.toISOString() : '';
  }

  public preview(): string {
    return this.format();
  }

  public format(showInvalid = true): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if ([undefined, null, ''].includes(this.value)) {
      return '';
    }

    if (!this.isValidMomentDate()) {
      return showInvalid ? formatUnknownDataValue(this.value, true) : '';
    }

    return this.config?.format ? this.momentDate.format(this.config.format) : formatUnknownDataValue(this.value);
  }

  public title(): string {
    return unescapeHtml(this.format());
  }

  public editValue(): string {
    return unescapeHtml(this.format());
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return true;
    }

    if (!this.value && this.value !== 0) {
      return true;
    }

    if (!this.isValidMomentDate()) {
      return false;
    }

    return ignoreConfig || this.isWithinRange();
  }

  private isValidMomentDate(): boolean {
    return this.momentDate?.isValid();
  }

  private isWithinRange(): boolean {
    if (!this.config || !this.momentDate) {
      return true;
    }

    const {format, minValue, maxValue} = this.config;

    const momentDate = resetUnusedMomentPart(this.momentDate, format);

    if (minValue) {
      const minDate = resetUnusedMomentPart(parseMomentDate(minValue, format), format);
      if (momentDate.diff(minDate) < 0) {
        return false;
      }
    }

    if (maxValue) {
      const maxDate = resetUnusedMomentPart(parseMomentDate(maxValue, format), format);
      if (momentDate.diff(maxDate) > 0) {
        return false;
      }
    }

    return true;
  }

  public increment(): DateTimeDataValue {
    const smallestUnit = getSmallestDateUnit(this.config?.format || '');
    const nextValue = this.momentDate.add(1, smallestUnit).toISOString();
    return new DateTimeDataValue(nextValue, this.config);
  }

  public decrement(): DateTimeDataValue {
    const smallestUnit = getSmallestDateUnit(this.config?.format || '');
    const nextValue = this.momentDate.subtract(1, smallestUnit).toISOString();
    return new DateTimeDataValue(nextValue, this.config);
  }

  public compareTo(otherValue: DateTimeDataValue): number {
    if (!this.momentDate || !otherValue.momentDate) {
      return this.momentDate ? 1 : -1;
    }

    return resetUnusedMomentPart(this.momentDate, this.config?.format).diff(
      resetUnusedMomentPart(otherValue.momentDate, otherValue.config?.format)
    );
  }

  public copy(newValue?: any): DateTimeDataValue {
    const value = newValue !== undefined ? newValue : this.momentDate?.toDate();
    return new DateTimeDataValue(value, this.config);
  }

  public toDate(): Date {
    const value = this.serialize();
    return value ? new Date(value) : null;
  }

  public parseInput(inputValue: string): DateTimeDataValue {
    return new DateTimeDataValue(inputValue, this.config, inputValue);
  }

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const otherMomentValues = this.mapConditionValues(values);
    const momentDates = otherMomentValues
      .map(value => resetUnusedMomentPart(this.momentDate, value.format))
      .sort((a, b) => this.compareMoments(a, b));

    const otherMoment = otherMomentValues[0] && otherMomentValues[0].moment;
    if (!this.momentDate && !otherMoment) {
      if (condition === ConditionType.Equals) {
        const otherValue = values[0] && values[0].value;
        return (!this.value && !otherValue) || this.value === otherValue;
      }
    } else if (!this.momentDate || !otherMoment) {
      if (condition === ConditionType.NotEquals) {
        return true;
      }
    }

    const allMomentDatesDefined = createRange(0, conditionNumInputs(condition)).every(
      index => momentDates[index] && otherMomentValues[index].moment
    );
    if (!allMomentDatesDefined) {
      return false;
    }

    switch (condition) {
      case ConditionType.Equals:
        return momentDates[0].isSame(otherMoment);
      case ConditionType.NotEquals:
        return !momentDates[0].isSame(otherMoment);
      case ConditionType.GreaterThan:
        return momentDates[0].isAfter(otherMoment);
      case ConditionType.GreaterThanEquals:
        return momentDates[0].isSameOrAfter(otherMoment);
      case ConditionType.LowerThan:
        return momentDates[0].isBefore(otherMoment);
      case ConditionType.LowerThanEquals:
        return momentDates[0].isSameOrBefore(otherMoment);
      case ConditionType.Between:
        return momentDates[0].isSameOrAfter(otherMoment) && momentDates[1].isSameOrBefore(otherMomentValues[1].moment);
      case ConditionType.NotBetween:
        return momentDates[0].isBefore(otherMoment) || momentDates[1].isAfter(otherMomentValues[1].moment);
      case ConditionType.IsEmpty:
        return isNullOrUndefined(this.value) || String(this.value).trim().length === 0;
      case ConditionType.NotEmpty:
        return isNotNullOrUndefined(this.value) && String(this.value).trim().length > 0;
      default:
        return false;
    }
  }

  private mapConditionValues(values: ConditionValue[]): {moment: moment.Moment; format: string}[] {
    return (values || [])
      .map(value => {
        if (value.type) {
          return {
            moment: constraintConditionValueMoment(value.type),
            format: constraintConditionValueFormat(value.type),
          };
        }
        const format = this.config?.format;
        return {
          moment: resetUnusedMomentPart(new DateTimeDataValue(value.value, this.config).momentDate, format),
          format,
        };
      })
      .sort((a, b) => this.compareMoments(a.moment, b.moment));
  }

  private compareMoments(a: moment.Moment, b: moment.Moment): number {
    if (!a || !b) {
      return a ? 1 : b ? -1 : 0;
    }
    return a.diff(b);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return valueMeetFulltexts(this.format(true), fulltexts);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    const dates = this.mapConditionValues(values).map(value => value.moment.toDate());

    switch (condition) {
      case ConditionType.Equals:
      case ConditionType.GreaterThanEquals:
      case ConditionType.LowerThanEquals:
        return this.copy(dates[0]).serialize();
      case ConditionType.GreaterThan:
      case ConditionType.Between:
        if (dates[0] && dates[1] && dates[0].getTime() === dates[1].getTime()) {
          return this.copy(dates[0]).serialize();
        }
        return this.copy(dates[0]).increment().serialize();
      case ConditionType.LowerThan:
      case ConditionType.NotBetween:
        return this.copy(dates[0]).decrement().serialize();
      case ConditionType.NotEquals:
        return values[0].value || values[0].type ? '' : this.copy(new Date()).serialize();
      case ConditionType.IsEmpty:
        return '';
      case ConditionType.NotEmpty:
        return this.copy(new Date()).serialize();
      default:
        return null;
    }
  }
}

function constraintConditionValueFormat(value: ConstraintConditionValue): string {
  switch (value) {
    case DateTimeConstraintConditionValue.Yesterday:
    case DateTimeConstraintConditionValue.Tomorrow:
    case DateTimeConstraintConditionValue.Today:
      return 'DD M Y';
    case DateTimeConstraintConditionValue.LastWeek:
    case DateTimeConstraintConditionValue.NextWeek:
    case DateTimeConstraintConditionValue.ThisWeek:
      return 'W Y';
    case DateTimeConstraintConditionValue.LastMonth:
    case DateTimeConstraintConditionValue.NextMonth:
    case DateTimeConstraintConditionValue.ThisMonth:
      return 'M Y';
    default:
      return '';
  }
}

function isISOFormat(value: any): boolean {
  return String(value || '').match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}/g)?.length > 0;
}

function constraintConditionValueMoment(value: ConstraintConditionValue): moment.Moment {
  switch (value) {
    case DateTimeConstraintConditionValue.Yesterday:
      return moment().startOf('day').subtract(1, 'day');
    case DateTimeConstraintConditionValue.Tomorrow:
      return moment().startOf('day').add(1, 'day');
    case DateTimeConstraintConditionValue.Today:
      return moment().startOf('day');
    case DateTimeConstraintConditionValue.LastWeek:
      return resetWeek(moment().startOf('day').subtract(1, 'week'));
    case DateTimeConstraintConditionValue.NextWeek:
      return resetWeek(moment().startOf('day').add(1, 'week'));
    case DateTimeConstraintConditionValue.ThisWeek:
      return resetWeek(moment().startOf('day'));
    case DateTimeConstraintConditionValue.LastMonth:
      return moment().startOf('month').subtract(1, 'month');
    case DateTimeConstraintConditionValue.NextMonth:
      return moment().startOf('month').add(1, 'month');
    case DateTimeConstraintConditionValue.ThisMonth:
      return moment().startOf('month');
    default:
      return null;
  }
}
