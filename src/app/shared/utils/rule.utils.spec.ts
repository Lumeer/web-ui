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

import {ChronoUnit, CronRule, CronRuleConfiguration, RuleType} from '../../core/model/rule';
import * as moment from 'moment';
import {computeCronRuleNextExecution} from './rule.utils';

fdescribe('computeCronRuleNextExecution daily', () => {
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
    const startsOnMoment = moment.utc().startOf('day').add(5, 'days');
    const rule = createCronRule({
      interval: 3,
      hour: '9',
      unit: ChronoUnit.Days,
      startsOn: startsOnMoment.toDate(),
      endsOn,
    });
    const today = moment.utc().toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(
      moment.utc().startOf('day').add(5, 'day').hour(9).toDate()
    );
  });

  it('should run after starts on and after ends on', () => {
    const endsOn = moment.utc().startOf('day').add(1, 'days').toDate();
    const startsOnMoment = moment.utc().startOf('day').add(5, 'days').hour(14);
    const rule = createCronRule({
      interval: 3,
      hour: '9',
      unit: ChronoUnit.Days,
      startsOn: startsOnMoment.toDate(),
      endsOn,
    });
    const today = moment.utc().toDate();
    expect(computeCronRuleNextExecution(rule, today)).toEqual(null);
  });
});

describe('computeCronRuleNextExecution weekly', () => {
  it('should escape two plus signs', () => {});
});

describe('computeCronRuleNextExecution monthly', () => {
  it('should escape two plus signs', () => {});
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
      startsOn: moment().add(-10, 'days').toDate(),
      interval: 1,
      occurrence: 1,
      daysOfWeek: 1,
      blocklyXml: '',
      blocklyJs: '',
      ...configuration,
    },
  };
}
