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

import {CronRule, CronRuleConfiguration, Rule, RuleType} from '../../core/model/rule';
import {createRange} from './array.utils';
import {bitSet, bitTest, isNotNullOrUndefined, isNullOrUndefined} from './common.utils';

export enum RuleOffsetType {
  Up = 'up',
  Down = 'down',
}

export function offsetRuleConfig(rule: Rule, offsetType: RuleOffsetType): Rule {
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
  if (!checkCronRuneWillRun(rule)) {
    return null;
  }
}

function checkCronRuneWillRun(rule: CronRule): boolean {
  return (
    rule?.configuration &&
    isNotNullOrUndefined(rule.configuration.startsOn) &&
    (isNullOrUndefined(rule.configuration.executionsLeft) || rule.configuration.executionsLeft > 0) &&
    (isNullOrUndefined(rule.configuration.endsOn) || rule.configuration.endsOn < new Date())
  );
}
