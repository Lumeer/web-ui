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

import {QueryCondition} from '../../store/navigation/query/query';
import {DateTimeConstraintConfig} from '../data/constraint-config';
import {DateTimeDataValue} from './datetime.data-value';
import * as moment from 'moment';
import {DateTimeConstraintConditionValue} from '../data/constraint-condition';

describe('DateTimeDataValue', () => {
  const yearConfig: DateTimeConstraintConfig = {format: 'Y'};
  const monthConfig: DateTimeConstraintConfig = {format: 'MM Y'};
  const dayConfig: DateTimeConstraintConfig = {format: 'D.MM.YYYY'};
  const hoursConfig: DateTimeConstraintConfig = {format: 'D-MM-Y HH'};
  const secondsConfig: DateTimeConstraintConfig = {format: 'DD.MM.YYYY HH:mm:ss'};

  const today = moment().toDate();
  const yesterday = moment().subtract(1, 'day').toDate();
  const tomorrow = moment().add(1, 'day').toDate();
  const lastWeek = moment().subtract(1, 'week').toDate();
  const nextWeek = moment().add(1, 'week').toDate();
  const lastMonth = moment().subtract(1, 'month').toDate();
  const nextMonth = moment().add(1, 'month').toDate();

  describe('meet condition', () => {
    it('equals by specific date', () => {
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), yearConfig).meetCondition(QueryCondition.Equals, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), monthConfig).meetCondition(QueryCondition.Equals, [
          {value: new Date(2019, 10, 10, 20, 30)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(
          new Date(2019, 10, 20, 10, 20, 30, 123),
          secondsConfig
        ).meetCondition(QueryCondition.Equals, [{value: new Date(2019, 10, 20, 10, 20, 30, 500)}])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), dayConfig).meetCondition(QueryCondition.NotEquals, [
          {value: new Date(2019, 10, 20, 20, 30, 12)},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), yearConfig).meetCondition(QueryCondition.NotEquals, [
          {value: new Date(2018, 3, 10, 20, 30)},
        ])
      ).toBeTruthy();
    });

    it('equals by today', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(yesterday, secondsConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeFalsy();
    });

    it('equals by yesterday', () => {
      expect(
        new DateTimeDataValue(yesterday, secondsConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(yesterday, secondsConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeFalsy();
    });

    it('equals by tomorrow', () => {
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.Tomorrow},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.Tomorrow},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(yesterday, secondsConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.Tomorrow},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.Tomorrow},
        ])
      ).toBeFalsy();
    });

    it('equals by this week', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.ThisWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(nextWeek, secondsConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.ThisWeek},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.ThisWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.ThisWeek},
        ])
      ).toBeFalsy();
    });

    it('equals by this month', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.ThisMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastMonth, secondsConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.ThisMonth},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(nextMonth, secondsConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.ThisMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.ThisMonth},
        ])
      ).toBeFalsy();
    });

    it('equals by last week', () => {
      expect(
        new DateTimeDataValue(lastWeek, dayConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.LastWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, dayConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.LastWeek},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(nextMonth, dayConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.LastWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastWeek, dayConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.LastWeek},
        ])
      ).toBeFalsy();
    });

    it('equals by last month', () => {
      expect(
        new DateTimeDataValue(lastMonth, hoursConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.LastMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(nextWeek, hoursConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.LastMonth},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(nextMonth, hoursConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.LastMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastMonth, hoursConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.LastMonth},
        ])
      ).toBeFalsy();
    });

    it('equals by next month', () => {
      expect(
        new DateTimeDataValue(nextMonth, dayConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, dayConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(lastWeek, dayConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(nextMonth, dayConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeFalsy();
    });

    it('equals by next week', () => {
      expect(
        new DateTimeDataValue(nextWeek, secondsConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(QueryCondition.Equals, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(lastMonth, secondsConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(nextWeek, secondsConfig).meetCondition(QueryCondition.NotEquals, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeFalsy();
    });

    it('greater than by specific date', () => {
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), dayConfig).meetCondition(QueryCondition.GreaterThan, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), monthConfig).meetCondition(QueryCondition.GreaterThan, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), yearConfig).meetCondition(QueryCondition.GreaterThan, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeFalsy();
    });

    it('greater than by types', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.GreaterThan, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.GreaterThan, [
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(QueryCondition.GreaterThan, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(QueryCondition.GreaterThan, [
          {type: DateTimeConstraintConditionValue.LastWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(QueryCondition.GreaterThan, [
          {type: DateTimeConstraintConditionValue.LastMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastMonth, secondsConfig).meetCondition(QueryCondition.GreaterThan, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeFalsy();
    });

    it('lower than by specific date', () => {
      expect(
        new DateTimeDataValue(new Date(2019, 2, 20, 10, 20), dayConfig).meetCondition(QueryCondition.LowerThan, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 3, 20, 10, 20), monthConfig).meetCondition(QueryCondition.LowerThan, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(new Date(2018, 10, 20, 10, 20), yearConfig).meetCondition(QueryCondition.LowerThan, [
          {value: new Date(2019, 3, 10, 20, 30)},
        ])
      ).toBeTruthy();
    });

    it('lower than by types', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.LowerThan, [
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(yesterday, secondsConfig).meetCondition(QueryCondition.LowerThan, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(QueryCondition.LowerThan, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(QueryCondition.LowerThan, [
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastMonth, secondsConfig).meetCondition(QueryCondition.LowerThan, [
          {type: DateTimeConstraintConditionValue.Tomorrow},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(nextMonth, secondsConfig).meetCondition(QueryCondition.LowerThan, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeFalsy();
    });

    it('greater than equals by specific date', () => {
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), dayConfig).meetCondition(
          QueryCondition.GreaterThanEquals,
          [{value: new Date(2019, 10, 20, 2, 30)}]
        )
      ).toBeTruthy();

      expect(
        new DateTimeDataValue(
          new Date(2019, 10, 20, 10, 20),
          yearConfig
        ).meetCondition(QueryCondition.GreaterThanEquals, [{value: new Date(2019, 3, 10, 20, 30)}])
      ).toBeTruthy();

      expect(
        new DateTimeDataValue(
          new Date(2019, 2, 20, 10, 20),
          monthConfig
        ).meetCondition(QueryCondition.GreaterThanEquals, [{value: new Date(2019, 3, 10, 20, 30)}])
      ).toBeFalsy();
    });

    it('greater than equals by types', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.GreaterThanEquals, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(nextMonth, secondsConfig).meetCondition(QueryCondition.GreaterThanEquals, [
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(yesterday, secondsConfig).meetCondition(QueryCondition.GreaterThanEquals, [
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeFalsy();
    });

    it('between by specific dates', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.Between, [
          {value: yesterday},
          {value: tomorrow},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 1), yearConfig).meetCondition(QueryCondition.Between, [
          {value: new Date(2019, 3, 20, 10)},
          {value: new Date(2019, 5, 20, 10)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 1), dayConfig).meetCondition(QueryCondition.Between, [
          {value: new Date(2019, 3, 20, 10)},
          {value: new Date(2019, 5, 20, 10)},
        ])
      ).toBeFalsy();
    });

    it('between by types', () => {
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.Between, [
          {type: DateTimeConstraintConditionValue.Today},
          {type: DateTimeConstraintConditionValue.Tomorrow},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.Between, [
          {type: DateTimeConstraintConditionValue.Tomorrow},
          {type: DateTimeConstraintConditionValue.Yesterday},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(QueryCondition.Between, [
          {type: DateTimeConstraintConditionValue.LastMonth},
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeTruthy();
    });

    it('not between by specific dates', () => {
      expect(
        new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(QueryCondition.NotBetween, [
          {value: yesterday},
          {value: today},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 1), dayConfig).meetCondition(QueryCondition.NotBetween, [
          {value: new Date(2019, 3, 20, 10)},
          {value: new Date(2019, 5, 20, 10)},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 1), yearConfig).meetCondition(QueryCondition.NotBetween, [
          {value: new Date(2019, 3, 20, 10)},
          {value: new Date(2019, 5, 20, 10)},
        ])
      ).toBeFalsy();
    });

    it('not between by types', () => {
      expect(
        new DateTimeDataValue(lastWeek, secondsConfig).meetCondition(QueryCondition.NotBetween, [
          {type: DateTimeConstraintConditionValue.Today},
          {type: DateTimeConstraintConditionValue.NextWeek},
        ])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.NotBetween, [
          {type: DateTimeConstraintConditionValue.LastMonth},
          {type: DateTimeConstraintConditionValue.NextMonth},
        ])
      ).toBeFalsy();
      expect(
        new DateTimeDataValue(nextMonth, secondsConfig).meetCondition(QueryCondition.NotBetween, [
          {type: DateTimeConstraintConditionValue.LastMonth},
          {type: DateTimeConstraintConditionValue.Today},
        ])
      ).toBeTruthy();
    });

    it('is empty', () => {
      expect(new DateTimeDataValue('  ', secondsConfig).meetCondition(QueryCondition.IsEmpty, [])).toBeTruthy();
      expect(new DateTimeDataValue(0, secondsConfig).meetCondition(QueryCondition.IsEmpty, [])).toBeFalsy();
      expect(new DateTimeDataValue(today, secondsConfig).meetCondition(QueryCondition.IsEmpty, [])).toBeFalsy();
    });

    it('is not empty', () => {
      expect(new DateTimeDataValue(tomorrow, secondsConfig).meetCondition(QueryCondition.NotEmpty, [])).toBeTruthy();
      expect(new DateTimeDataValue(0, secondsConfig).meetCondition(QueryCondition.NotEmpty, [])).toBeTruthy();
      expect(new DateTimeDataValue('   ', secondsConfig).meetCondition(QueryCondition.NotEmpty, [])).toBeFalsy();
    });
  });

  describe('meet fulltext', () => {
    it('multiple', () => {
      expect(new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), dayConfig).meetFullTexts([])).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), dayConfig).meetFullTexts(['20.11.2019'])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), dayConfig).meetFullTexts(['20', '11', '2019'])
      ).toBeTruthy();
      expect(
        new DateTimeDataValue(new Date(2019, 10, 20, 10, 20), yearConfig).meetFullTexts(['20', '11', '2019'])
      ).toBeFalsy();
    });
  });
});
