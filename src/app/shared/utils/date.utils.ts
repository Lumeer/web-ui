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
import {DurationInputArg2} from 'moment';

import {
  Constraint,
  ConstraintData,
  ConstraintType,
  DateTimeConstraint,
  DurationConstraint,
  DurationUnit,
  sortedDurationUnits,
} from '@lumeer/data-filters';

import {LanguageCode} from '../../core/model/language';
import {createDateTimeOptions} from '../date-time/date-time-options';

export function defaultDateFormat(locale: LanguageCode): string {
  switch (locale) {
    case LanguageCode.CZ:
      return 'DD.MM.YYYY';
    default:
      return 'MM/DD/YYYY';
  }
}

const durationUnitToMomentUnitMap: Record<DurationUnit, DurationInputArg2> = {
  [DurationUnit.Weeks]: 'weeks',
  [DurationUnit.Days]: 'days',
  [DurationUnit.Hours]: 'hours',
  [DurationUnit.Minutes]: 'minutes',
  [DurationUnit.Seconds]: 'seconds',
};

export function addDurationToDate(date: Date, durationCountsMap: Record<DurationUnit, number>, utc: boolean): Date {
  const dateMoment = utc ? moment.utc(date) : moment(date);
  Object.entries(durationCountsMap).forEach(([unit, count]) => {
    dateMoment.add(count, durationUnitToMomentUnitMap[unit]);
  });

  return dateMoment.toDate();
}

export function subtractDurationFromDate(
  date: Date,
  durationCountsMap: Record<DurationUnit, number>,
  utc: boolean
): Date {
  const dateMoment = utc ? moment.utc(date) : moment(date);
  Object.entries(durationCountsMap).forEach(([unit, count]) => {
    dateMoment.add(-Math.abs(count), durationUnitToMomentUnitMap[unit]);
  });

  return dateMoment.toDate();
}

export function subtractDatesToDurationCountsMap(end: Date, start: Date): Record<DurationUnit | string, number> {
  let endMoment = moment(end);
  const startMoment = moment(start);

  return sortedDurationUnits.reduce((map, unit) => {
    const momentUnit = durationUnitToMomentUnitMap[unit];
    const count = Math.floor(endMoment.diff(startMoment, momentUnit, true));
    if (count > 0) {
      endMoment = endMoment.subtract(count, momentUnit);
    }

    map[unit] = count;

    return map;
  }, {});
}

const dateFormats = ['DD.MM.YYYY', 'YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY', 'DD.MM.'];

export function parseDateTimeByConstraint(value: any, constraint: Constraint): Date | null {
  if (!value) {
    return value;
  }

  if (constraint?.type === ConstraintType.DateTime) {
    return (<DateTimeConstraint>constraint).createDataValue(value).toDate();
  }

  return parseMomentDate(value, null)?.toDate();
}

export function parseMomentDate(value: any, expectedFormat?: string, utc?: boolean): moment.Moment | null {
  if (!value) {
    return null;
  }

  const formats = [moment.ISO_8601, ...dateFormats];
  if (expectedFormat) {
    const result = utc ? moment.utc(value, [expectedFormat]) : moment(value, [expectedFormat]);

    if (result.isValid()) {
      return result;
    }

    formats.splice(1, 0, expectedFormat);
  }

  return utc ? moment.utc(value, formats) : moment(value, formats);
}

export function constraintContainsHoursInConfig(constraint: Constraint): boolean {
  if (constraint?.type === ConstraintType.DateTime) {
    const format = (<DateTimeConstraint>constraint).config?.format;
    return createDateTimeOptions(format).hours;
  }
  return false;
}

export function createDatesInterval(
  start: string,
  startConstraint: Constraint,
  end: string,
  endConstraint: Constraint,
  constraintData: ConstraintData
): {start?: Date; startUtc?: boolean; end?: Date; endUtc?: boolean; swapped?: boolean} {
  if (startConstraint?.type === ConstraintType.DateTime && endConstraint?.type === ConstraintType.Duration) {
    const startDate = parseDateTimeByConstraint(start, startConstraint);
    const dataValue = (<DurationConstraint>endConstraint).createDataValue(end, constraintData);
    const utc = (<DateTimeConstraint>startConstraint).config?.asUtc;
    const endDate = addDurationToDate(startDate, dataValue.unitsCountMap, utc);
    return checkDatesInterval(startDate, utc, endDate, utc, endConstraint);
  }
  if (startConstraint?.type === ConstraintType.Duration && endConstraint?.type === ConstraintType.DateTime) {
    const endDate = parseDateTimeByConstraint(end, endConstraint);
    const dataValue = (<DurationConstraint>startConstraint).createDataValue(start, constraintData);
    const utc = (<DateTimeConstraint>endConstraint).config?.asUtc;
    const startDate = subtractDurationFromDate(endDate, dataValue.unitsCountMap, utc);
    return checkDatesInterval(startDate, utc, endDate, utc, endConstraint);
  }

  const startDate = parseDateTimeByConstraint(start, startConstraint);
  const startUtc = (<DateTimeConstraint>startConstraint)?.config?.asUtc;
  const endDate = parseDateTimeByConstraint(end, endConstraint);
  const endUtc = (<DateTimeConstraint>endConstraint)?.config?.asUtc;
  return checkDatesInterval(startDate, startUtc, endDate, endUtc, endConstraint);
}

function checkDatesInterval(
  start: Date,
  startUtc: boolean,
  end: Date,
  endUtc: boolean,
  endConstraint: Constraint
): {start?: Date; startUtc?: boolean; end?: Date; endUtc?: boolean; swapped?: boolean} {
  if (start && end && end.getTime() < start.getTime()) {
    if (endConstraint?.type === ConstraintType.Duration) {
      // it means that duration is less than 0
      return {start, end: start};
    }
    return {start: end, startUtc, end: start, endUtc, swapped: true};
  }
  return {start, startUtc, end, endUtc};
}

export function datesAreSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
}
