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

import {isDateValid, isNullOrUndefined} from '@lumeer/utils';

import {ChronoUnit, CronRule, CronRuleConfiguration, Rule, RuleType} from '../../core/model/rule';
import {createRange} from './array.utils';
import {bitSet, bitTest} from './common.utils';

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

  const utcTime = moment.utc(time).toDate();

  let executionDate: Date;
  switch (rule.configuration.unit) {
    case ChronoUnit.Days:
      executionDate = computeCronDailyNextExecution(rule, utcTime);
      break;
    case ChronoUnit.Weeks:
      executionDate = computeCronWeeklyNextExecution(rule, utcTime);
      break;
    case ChronoUnit.Months:
      executionDate = computeCronMonthlyNextExecution(rule, utcTime);
      break;
    default:
      return null;
  }

  if (executionDate < utcTime) {
    return utcTime;
  }

  if (isDateValid(rule.configuration.endsOn) && executionDate > rule.configuration.endsOn) {
    return null;
  }

  return executionDate;
}

function computeCronDailyNextExecution(rule: CronRule, time: Date): Date {
  const config = rule.configuration;
  let dateMoment: moment.Moment;
  if (isDateValid(config.lastRun)) {
    dateMoment = moment.utc(config.lastRun).startOf('day').add(config.interval, 'days').hour(+config.hour);
  } else {
    dateMoment = moment.utc().startOf('day').hour(+config.hour);
    if (time.getTime() > dateMoment.toDate().getTime()) {
      dateMoment = dateMoment.add(1, 'day');
    }
  }

  if (dateMoment.toDate() > config.startsOn) {
    return dateMoment.toDate();
  }
  return moment.utc(config.startsOn).startOf('day').hour(+config.hour).toDate();
}

function computeCronWeeklyNextExecution(rule: CronRule, time: Date): Date {
  const config = rule.configuration;
  const startDate = isDateValid(config.lastRun) ? config.lastRun : time;
  const endDate = config.startsOn > time ? config.startsOn : time;
  const executionDates = createWeeklyExecutionDates(config, startDate, endDate);

  for (const executionDate of executionDates) {
    if (executionDate > endDate) {
      return executionDate;
    }
  }

  return time;
}

function createWeeklyExecutionDates(configuration: CronRuleConfiguration, start: Date, end: Date): Date[] {
  const dates = [];

  const days = createRange(0, 7).filter(day => bitTest(configuration.daysOfWeek, day));

  let currentMoment = moment.utc(start).startOf('day').hour(+configuration.hour);
  while (dates.length === 0 || dates[dates.length - 1] < end) {
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
  if (!config.occurrence || config.occurrence < 0) {
    return null;
  }

  let dateMoment: moment.Moment;
  if (isDateValid(config.lastRun)) {
    dateMoment = setDayOfMonth(
      moment.utc(config.lastRun).startOf('month').add(config.interval, 'months').hour(+config.hour),
      config.occurrence
    );
  } else {
    dateMoment = setDayOfMonth(moment.utc().startOf('month').hour(+config.hour), config.occurrence);
  }

  const minDate = config.startsOn > time ? config.startsOn : time;

  if (dateMoment.toDate() > minDate) {
    return dateMoment.toDate();
  }

  dateMoment = setDayOfMonth(moment.utc(minDate).startOf('month').hour(+config.hour), config.occurrence);

  if (dateMoment.toDate() > minDate) {
    return dateMoment.toDate();
  }
  return setDayOfMonth(dateMoment.date(1).add(1, 'month'), config.occurrence).toDate();
}

function setDayOfMonth(moment: moment.Moment, day: number): moment.Moment {
  return moment.date(Math.min(day, moment.daysInMonth()));
}

function checkCronRuneWillRun(rule: CronRule, time: Date): boolean {
  return (
    cronRuleConfigurationIsValid(rule) &&
    isDateValid(rule.configuration.startsOn) &&
    (isNullOrUndefined(rule.configuration.executionsLeft) || rule.configuration.executionsLeft > 0) &&
    (!isDateValid(rule.configuration.endsOn) || rule.configuration.endsOn > time)
  );
}

function cronRuleConfigurationIsValid(rule: CronRule): boolean {
  const config = rule?.configuration;
  if (!config) {
    return;
  }

  const hour = +config.hour;
  if (hour < 0 || hour > 24) {
    return false;
  }

  if (config.interval < 1) {
    return false;
  }

  switch (config.unit) {
    case ChronoUnit.Weeks:
      return config.daysOfWeek > 0;
    case ChronoUnit.Months:
      return config.occurrence > 0;
  }

  return true;
}
