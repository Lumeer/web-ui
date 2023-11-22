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

import {ChronoUnit, CronRule, CronRuleConfiguration, RuleType} from '../../core/model/rule';
import {computeCronRuleNextExecution} from './rule.utils';

describe('computeCronRuleNextExecution daily', () => {
  it('should run today', () => {
    const rule = createCronRule({interval: 1, hour: '9', unit: ChronoUnit.Days});
    const today = moment.utc().startOf('day').hour(7).toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(moment.utc().startOf('day').hour(9).toDate());
  });

  it('should run next day', () => {
    const rule = createCronRule({interval: 1, hour: '12', unit: ChronoUnit.Days});
    const today = moment.utc().startOf('day').hour(14).toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(
      moment.utc().startOf('day').add(1, 'day').hour(12).toDate()
    );
  });

  it('should run after last run', () => {
    const lastRunMoment = moment.utc().startOf('day').add(-3, 'days').hour(10);
    const rule = createCronRule({interval: 8, hour: '8', unit: ChronoUnit.Days, lastRun: lastRunMoment.toDate()});
    const today = moment.utc().toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(lastRunMoment.add(8, 'day').hour(8).toDate());
  });

  it('should run after starts on and before ends on', () => {
    const endsOn = moment.utc().startOf('day').add(15, 'days').toDate();
    const startsOn = moment.utc().startOf('day').add(5, 'days').toDate();
    const rule = createCronRule({
      interval: 3,
      hour: '9',
      unit: ChronoUnit.Days,
      startsOn,
      endsOn,
    });
    const today = moment.utc().toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(
      moment.utc().startOf('day').add(5, 'day').hour(9).toDate()
    );
  });

  it('should not run after starts on and after ends on', () => {
    const endsOn = moment.utc().startOf('day').add(1, 'days').toDate();
    const startsOn = moment.utc().startOf('day').add(5, 'days').hour(14).toDate();
    const rule = createCronRule({
      interval: 3,
      hour: '9',
      unit: ChronoUnit.Days,
      startsOn,
      endsOn,
    });
    const today = moment.utc().toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(null);
  });
});

describe('computeCronRuleNextExecution weekly', () => {
  it('should run this week today', () => {
    const rule = createCronRule({interval: 1, hour: '9', unit: ChronoUnit.Weeks, daysOfWeek: 127}); // every day
    const today = moment.utc().startOf('day').hour(7).toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(moment.utc().startOf('day').hour(9).toDate());
  });

  it('should run this week on wednesday', () => {
    const rule = createCronRule({interval: 1, hour: '9', unit: ChronoUnit.Weeks, daysOfWeek: 4}); // wednesday
    const today = moment.utc().isoWeekday(1).startOf('day').hour(7).toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(
      moment.utc().isoWeekday(3).startOf('day').hour(9).toDate()
    );
  });

  it('should run this week on sunday', () => {
    const rule = createCronRule({interval: 1, hour: '9', unit: ChronoUnit.Weeks, daysOfWeek: 64}); // sunday
    const today = moment.utc().isoWeekday(1).startOf('day').hour(7).toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(
      moment.utc().isoWeekday(7).startOf('day').hour(9).toDate()
    );
  });

  it('should run next week on monday', () => {
    const rule = createCronRule({interval: 1, hour: '9', unit: ChronoUnit.Weeks, daysOfWeek: 1}); // monday
    const today = moment.utc().isoWeekday(7).startOf('day').hour(7).toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(
      moment.utc().isoWeekday(1).add(1, 'week').startOf('day').hour(9).toDate()
    );
  });

  it('should run next week on sunday', () => {
    const rule = createCronRule({interval: 1, hour: '9', unit: ChronoUnit.Weeks, daysOfWeek: 64}); // sunday
    const today = moment.utc().isoWeekday(7).startOf('day').hour(16).toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(
      moment.utc().isoWeekday(7).add(1, 'week').startOf('day').hour(9).toDate()
    );
  });

  it('should run after last run', () => {
    const lastRunMoment = moment.utc().startOf('day').add(-3, 'weeks').hour(10);
    const rule = createCronRule({
      interval: 8,
      hour: '8',
      unit: ChronoUnit.Weeks,
      lastRun: lastRunMoment.toDate(),
      daysOfWeek: 2,
    }); //tuesday
    const today = moment.utc().toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(
      lastRunMoment.add(8, 'weeks').isoWeekday(2).hour(8).toDate()
    );
  });

  it('should run after starts on and before ends on', () => {
    const endsOn = moment.utc().startOf('day').add(15, 'months').toDate();
    const startsOnMoment = moment.utc().startOf('day').add(5, 'weeks').isoWeekday(6); // saturday
    const rule = createCronRule({
      interval: 3,
      hour: '9',
      unit: ChronoUnit.Weeks,
      startsOn: startsOnMoment.toDate(),
      endsOn,
      daysOfWeek: 8,
    }); // thursday
    const today = moment.utc().toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(
      startsOnMoment.add(1, 'week').hour(9).isoWeekday(4).toDate()
    );
  });
});

describe('computeCronRuleNextExecution monthly', () => {
  it('should run this month', () => {
    const rule = createCronRule({interval: 1, hour: '9', unit: ChronoUnit.Months, occurrence: 15});
    const today = moment.utc().startOf('month').hour(7).toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(moment.utc().startOf('month').date(15).hour(9).toDate());
  });

  it('should run next month', () => {
    const rule = createCronRule({interval: 3, hour: '7', unit: ChronoUnit.Months, occurrence: 8});
    const today = moment.utc().endOf('month').hour(13).toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(
      moment.utc().startOf('month').add(1, 'month').date(8).hour(7).toDate()
    );
  });

  it('should run after last run', () => {
    const lastRunMoment = moment.utc().startOf('month').add(-3, 'month').hour(10);
    const rule = createCronRule({interval: 5, hour: '8', unit: ChronoUnit.Months, lastRun: lastRunMoment.toDate()});
    const today = moment.utc().toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(lastRunMoment.add(5, 'month').hour(8).toDate());
  });

  it('should run after starts on and before ends on', () => {
    const endsOn = moment.utc().endOf('month').add(15, 'months').toDate();
    const startsOn = moment.utc().startOf('month').add(7, 'month').date(10).toDate();
    const rule = createCronRule({
      interval: 3,
      hour: '9',
      occurrence: 5,
      unit: ChronoUnit.Months,
      startsOn,
      endsOn,
    });
    const today = moment.utc().toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(
      moment.utc().startOf('month').add(8, 'month').hour(9).date(5).toDate()
    );
  });

  it('should not run after starts on and after ends on', () => {
    const endsOn = moment.utc().endOf('month').add(1, 'months').toDate();
    const startsOn = moment.utc().startOf('month').add(7, 'month').date(10).toDate();
    const rule = createCronRule({
      interval: 1,
      hour: '9',
      unit: ChronoUnit.Days,
      startsOn,
      endsOn,
    });
    const today = moment.utc().toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(null);
  });
});

function createCronRule(configuration: Partial<CronRuleConfiguration>): CronRule {
  return {
    timing: null,
    id: '1',
    type: RuleType.Cron,
    name: 'abc',
    configuration: {
      endsOn: null,
      lastRun: null,
      hour: '9',
      unit: ChronoUnit.Days,
      startsOn: moment().add(-100, 'days').toDate(),
      interval: 1,
      occurrence: 1,
      daysOfWeek: 1,
      blocklyXml: '',
      blocklyJs: '',
      ...configuration,
    },
  };
}
