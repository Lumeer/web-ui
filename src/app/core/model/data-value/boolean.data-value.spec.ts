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

import {BooleanDataValue} from './boolean.data-value';
import {ConditionType} from '../attribute-filter';

describe('BooleanDataValue', () => {
  describe('meet condition', () => {
    it('equals', () => {
      expect(new BooleanDataValue('true').meetCondition(ConditionType.Equals, [{value: true}])).toBeTruthy();

      expect(new BooleanDataValue(true).meetCondition(ConditionType.Equals, [{value: true}])).toBeTruthy();

      expect(new BooleanDataValue('').meetCondition(ConditionType.Equals, [{value: true}])).toBeFalsy();

      expect(new BooleanDataValue('').meetCondition(ConditionType.Equals, [{value: false}])).toBeTruthy();

      expect(new BooleanDataValue(null).meetCondition(ConditionType.Equals, [{value: true}])).toBeFalsy();

      expect(new BooleanDataValue(null).meetCondition(ConditionType.Equals, [{value: false}])).toBeTruthy();

      expect(new BooleanDataValue(undefined).meetCondition(ConditionType.Equals, [{value: false}])).toBeTruthy();

      expect(new BooleanDataValue(null).meetCondition(ConditionType.Equals, [{value: undefined}])).toBeTruthy();
    });

    it('not equals', () => {
      expect(new BooleanDataValue('true').meetCondition(ConditionType.NotEquals, [{value: 'true'}])).toBeFalsy();

      expect(new BooleanDataValue(undefined).meetCondition(ConditionType.NotEquals, [{value: false}])).toBeFalsy();

      expect(new BooleanDataValue('true').meetCondition(ConditionType.NotEquals, [{value: ''}])).toBeTruthy();

      expect(new BooleanDataValue('true').meetCondition(ConditionType.NotEquals, [{value: false}])).toBeTruthy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(new BooleanDataValue(true).meetFullTexts(['TRUE'])).toBeTruthy();
      expect(new BooleanDataValue(false).meetFullTexts(['FALSE'])).toBeTruthy();
    });
  });
});
