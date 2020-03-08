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

export function addDurationToDate(date: Date, durationCountsMap: Record<DurationUnit, number>): Date {
  const dateMoment = moment(date);
  Object.entries(durationCountsMap).forEach(([unit, count]) => {
    switch (unit) {
      case DurationUnit.Weeks:
        dateMoment.add(count, 'weeks');
        break;
      case DurationUnit.Days:
        dateMoment.add(count, 'days');
        break;
      case DurationUnit.Hours:
        dateMoment.add(count, 'hours');
        break;
      case DurationUnit.Minutes:
        dateMoment.add(count, 'minutes');
        break;
      case DurationUnit.Seconds:
        dateMoment.add(count, 'seconds');
        break;
    }
  });

  return dateMoment.toDate();
}
