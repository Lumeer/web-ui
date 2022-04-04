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

import {ChronoUnit, CronRule, CronRuleConfiguration, Rule, RuleType} from '../../core/model/rule';
import {createRange} from './array.utils';
import {bitSet, bitTest, isDateValid, isNullOrUndefined} from './common.utils';
import * as moment from 'moment';

export enum RuleOffsetType {
  Up = 'up',
  Down = 'down',
}

export function offsetRuleConfig<T extends Rule>(rule: T, offsetType: RuleOffsetType): T {
  if (rule?.type === RuleType.Cron) {
    const configuration = rule.configuration || ({} as CronRuleConfiguration);
    const offsetHours = (new Date().getTimezoneOffset() / 60) * (offsetType === RuleOffsetType.Up ? -1 : 1);
    let hourWithOffset = +configuration.hour + offsetHours;
    let dayOffset = 0;
    if (hourWithOffset < 0) {
      dayOffset = -1;
      hourWithOffset += 24;
    } else if (hourWithOffset > 23) {
      dayOffset = 1;
      hourWithOffset %= 24;
    }

    const daysOfWeek = offsetCronDaysOfWeek(configuration.daysOfWeek, dayOffset);
    const occurrence = offsetCronDaysOfMonth(configuration.occurrence, dayOffset);

    return {...rule, configuration: {...configuration, hour: hourWithOffset?.toString(), daysOfWeek, occurrence}};
  }

  return rule;
}

function offsetCronDaysOfWeek(daysOfWeek: number, offset: number): number {
  if (!daysOfWeek || !offset) {
    return daysOfWeek;
  }

  const days = createRange(0, 7)
    .filter(day => bitTest(daysOfWeek, day))
    .map(day => {
      if (day + offset > 6) {
        return (day + offset) % 7;
      } else if (day + offset < 0) {
        return day + offset + 7;
      }
      return day + offset;
    });

  return days.reduce((newDaysOfWeek, day) => bitSet(newDaysOfWeek, day), 0);
}

function offsetCronDaysOfMonth(dayOfMonth: number, offset: number): number {
  if (!dayOfMonth || !offset) {
    return dayOfMonth;
  }

  if (dayOfMonth + offset > 31) {
    return (dayOfMonth + offset) % 31;
  } else if (dayOfMonth + offset < 1) {
    return dayOfMonth + offset + 31;
  }

  return dayOfMonth + offset;
}

export function computeCronRuleNextExecution(rule: CronRule, time: Date = new Date()): Date {
  if (!checkCronRuneWillRun(rule, time)) {
    return null;
  }

  let executionDate: Date;
  switch (rule.configuration.unit) {
    case ChronoUnit.Days:
      executionDate = computeCronDailyNextExecution(rule, time);
      break;
    case ChronoUnit.Weeks:
      executionDate = computeCronWeeklyNextExecution(rule, time);
      break;
    case ChronoUnit.Months:
      executionDate = computeCronMonthlyNextExecution(rule, time);
      break;
    default:
      return null;
  }

  if (executionDate < time) {
    return offsetExecutionDate(time);
  }

  if (isDateValid(rule.configuration.endsOn) && executionDate > rule.configuration.endsOn) {
    return null;
  }

  return offsetExecutionDate(executionDate);
}

function offsetExecutionDate(date: Date): Date {
  if (date) {
    const parsedDate = new Date(date);
    parsedDate.setHours(parsedDate.getHours() + (parsedDate.getTimezoneOffset() / 60) * -1);
    return parsedDate;
  }
  return date;
}

function computeCronDailyNextExecution(rule: CronRule, time: Date): Date {
  const config = rule.configuration;
  if (isDateValid(config.lastRun)) {
    return truncateToHours(
      moment(config.lastRun)
        .add(config.interval, 'days')
        .hour(+config.hour)
    ).toDate();
  }

  const todayMoment = truncateToHours(moment().hour(+config.hour));
  if (time.getTime() > todayMoment.toDate().getTime()) {
    return todayMoment.add(1, 'day').toDate();
  }
  return todayMoment.toDate();
}

function computeCronWeeklyNextExecution(rule: CronRule, time: Date): Date {
  const config = rule.configuration;
  const startDate = isDateValid(config.lastRun) ? config.lastRun : time;
  const executionDates = createWeeklyExecutionDates(config, startDate, time);

  for (const executionDate of executionDates) {
    if (executionDate > time) {
      return executionDate;
    }
  }

  return time;
}

function createWeeklyExecutionDates(configuration: CronRuleConfiguration, start: Date, time: Date): Date[] {
  const dates = [];

  const days = createRange(0, 7).filter(day => bitTest(configuration.daysOfWeek, day));

  let currentMoment = truncateToHours(moment(start).hour(+configuration.hour));
  while (dates.length === 0 || dates[dates.length - 1] < time) {
    for (const day of days) {
      currentMoment = currentMoment.isoWeekday(day + 1); // 1 to 7 -> Monday to Sunday)
      dates.push(currentMoment.toDate());
    }
    currentMoment = currentMoment.add(configuration.interval, 'weeks');
  }

  return dates;
}

function computeCronMonthlyNextExecution(rule: CronRule, time: Date): Date {
  const config = rule.configuration;
  if (isDateValid(config.lastRun)) {
    const dateMoment = moment(config.lastRun)
      .startOf('month')
      .add(config.interval, 'months')
      .hour(+config.hour);
    return truncateToHours(setDayOfMonth(dateMoment, config.occurrence)).toDate();
  }

  const todayMoment = truncateToHours(setDayOfMonth(moment().hour(+config.hour), config.occurrence));
  if (time.getTime() > todayMoment.toDate().getTime()) {
    const dateMoment = todayMoment.startOf('month').add(1, 'month');
    return setDayOfMonth(dateMoment, config.occurrence).toDate();
  }
  return todayMoment.toDate();
}

function setDayOfMonth(moment: moment.Moment, day: number): moment.Moment {
  if (moment.daysInMonth() > day) {
    return moment.endOf('month');
  }
  return moment.date(day);
}

function truncateToHours(moment: moment.Moment): moment.Moment {
  return moment.minute(0).second(0).millisecond(0);
}

function checkCronRuneWillRun(rule: CronRule, time: Date): boolean {
  return (
    rule?.configuration &&
    isDateValid(rule.configuration.startsOn) &&
    (isNullOrUndefined(rule.configuration.executionsLeft) || rule.configuration.executionsLeft > 0) &&
    (!isDateValid(rule.configuration.endsOn) || rule.configuration.endsOn < time)
  );
}
