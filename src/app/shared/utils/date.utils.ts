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
import {createDateTimeOptions} from '../date-time/date-time-options';
import {DurationUnit} from '../../core/model/data/constraint-config';
import {DurationInputArg2} from 'moment';
import {sortedDurationUnits} from './constraint/duration-constraint.utils';
import {Constraint} from '../../core/model/constraint';
import {ConstraintData, ConstraintType} from '../../core/model/data/constraint';
import {DateTimeConstraint} from '../../core/model/constraint/datetime.constraint';
import {DurationConstraint} from '../../core/model/constraint/duration.constraint';

export function resetUnusedDatePart(date: Date, format: string): Date {
  return resetUnusedMomentPart(moment(date), format).toDate();
}

export function resetUnusedMomentPart(date: moment.Moment, format: string): moment.Moment {
  if (!date || !format) {
    return date;
  }

  const dateTimeOptions = createDateTimeOptions(format);

  let dateCopy = date;
  if (!dateTimeOptions.year) {
    dateCopy = resetYear(dateCopy);
  }

  if (!dateTimeOptions.month && !dateTimeOptions.week && !dateTimeOptions.quarter) {
    dateCopy = resetMonth(dateCopy);
  }

  if (!dateTimeOptions.day && !dateTimeOptions.week) {
    dateCopy = resetDay(dateCopy);
  }

  if (dateTimeOptions.week) {
    dateCopy = resetWeek(date);
  }

  if (!dateTimeOptions.hours) {
    dateCopy = resetHours(dateCopy);
  }

  if (!dateTimeOptions.minutes) {
    dateCopy = resetMinutes(dateCopy);
  }

  if (!dateTimeOptions.seconds) {
    dateCopy = resetSeconds(dateCopy);
  }

  if (!dateTimeOptions.milliseconds) {
    dateCopy = resetMilliseconds(dateCopy);
  }

  return dateCopy;
}

function resetYear(date: moment.Moment): moment.Moment {
  return date.clone().year(1970);
}

function resetMonth(date: moment.Moment): moment.Moment {
  return date.clone().month(0);
}

function resetWeek(date: moment.Moment): moment.Moment {
  return date.clone().weekday(0);
}

function resetDay(date: moment.Moment): moment.Moment {
  return date.clone().date(1);
}

function resetHours(date: moment.Moment): moment.Moment {
  return date.clone().hours(0);
}

function resetMinutes(date: moment.Moment): moment.Moment {
  return date.clone().minutes(0);
}

function resetSeconds(date: moment.Moment): moment.Moment {
  return date.clone().seconds(0);
}

function resetMilliseconds(date: moment.Moment): moment.Moment {
  return date.clone().milliseconds(0);
}

export function getSmallestDateUnit(format: string): moment.unitOfTime.Base {
  if (/[Sx]/.test(format)) {
    return 'millisecond';
  }
  if (/[sX]/.test(format)) {
    return 'second';
  }
  if (/[m]/.test(format)) {
    return 'minute';
  }
  if (/[H]/.test(format)) {
    return 'hour';
  }
  if (/[dDeE]/.test(format)) {
    return 'day';
  }
  if (/[gGwW]/.test(format)) {
    return 'week';
  }
  if (/[M]/.test(format)) {
    return 'month';
  }
  if (/[QY]/.test(format)) {
    return 'year';
  }
  return undefined;
}

const durationUnitToMomentUnitMap: Record<DurationUnit, DurationInputArg2> = {
  [DurationUnit.Weeks]: 'weeks',
  [DurationUnit.Days]: 'days',
  [DurationUnit.Hours]: 'hours',
  [DurationUnit.Minutes]: 'minutes',
  [DurationUnit.Seconds]: 'seconds',
};

export function addDurationToDate(date: Date, durationCountsMap: Record<DurationUnit, number>): Date {
  const dateMoment = moment(date);
  Object.entries(durationCountsMap).forEach(([unit, count]) => {
    dateMoment.add(count, durationUnitToMomentUnitMap[unit]);
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

const dateFormats = [
  'D.M.YYYY',
  'DD.M.YYYY',
  'DD.MM.YYYY',
  'D/M/YYYY',
  'DD/M/YYYY',
  'DD/MM/YYYY',
  'D/M/YY',
  'DD/M/YY',
  'DD/MM/YY',
  'YYYY/MM/DD',
  'YYYY/M/DD',
  'YYYY/M/D',
  'YYYY-MM-DD',
  'YYYY-M-DD',
  'YYYY-M-D',
  'D MMM YYYY',
  'DD MMM YYYY',
  'D MMMM YYYY',
  'DD MMMM YYYY',
  'MMM D, YYYY',
  'MMM DD, YYYY',
  'YYYY',
  'DD.MM.',
];

const timeFormats = [
  'HH:mm',
  'H:mm',
  'H:m',
  'hh:mm A',
  'hh:mmA',
  'h:mm A',
  'h:mmA',
  'hh.mm A',
  'hh.mmA',
  'h.mm A',
  'h.mmA',
];

export function parseDateTimeByConstraint(value: any, constraint: Constraint): Date {
  if (!value) {
    return value;
  }

  if (constraint && constraint.type === ConstraintType.DateTime) {
    const format = (<DateTimeConstraint>constraint).config.format;
    return parseDateTimeDataValue(value, format);
  }

  const dateAndTimeFormats = dateFormats.reduce((formats, format) => {
    formats.push(...timeFormats.map(tf => [format, tf].join(' ')));
    return formats;
  }, []);

  const allFormats = [moment.ISO_8601, ...dateFormats, ...dateAndTimeFormats];
  const momentDate = moment(value, allFormats);
  return momentDate.isValid() ? momentDate.toDate() : null;
}

function parseDateTimeDataValue(value: any, expectedFormat: string): Date {
  if (!value) {
    return value;
  }

  const momentDate = parseMomentDate(value, expectedFormat);
  if (!momentDate.isValid()) {
    return null;
  }

  return resetUnusedMomentPart(momentDate, expectedFormat).toDate();
}

export function parseMomentDate(value: any, expectedFormat: string): moment.Moment {
  const formats: any[] = [moment.ISO_8601];
  if (expectedFormat) {
    formats.push(expectedFormat);
  }
  return moment(value, formats);
}

export function createDatesInterval(
  start: string,
  startConstraint: Constraint,
  end: string,
  endConstraint: Constraint,
  constraintData: ConstraintData
): {start: Date; end?: Date; swapped?: boolean} {
  const startDate = parseDateTimeByConstraint(start, startConstraint);

  let endDate: Date;

  if (endConstraint?.type === ConstraintType.Duration) {
    const dataValue = (<DurationConstraint>endConstraint).createDataValue(end, constraintData);
    endDate = addDurationToDate(startDate, dataValue.unitsCountMap);
  } else {
    endDate = parseDateTimeByConstraint(end, endConstraint);
  }

  if (!endDate) {
    return {start: startDate};
  }

  if (endDate.getTime() < startDate.getTime()) {
    return {start: endDate, end: startDate, swapped: true};
  }
  return {start: startDate, end: endDate};
}
