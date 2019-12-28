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

import {UnknownDataValue} from './unknown.data-value';
import {QueryCondition} from '../../store/navigation/query/query';

describe('UnknownDataValue', () => {
  describe('meet condition', () => {
    it('equals', () => {
      const compareDataValue = {value: 'hello'};
      const dataValue1 = new UnknownDataValue('hello');
      expect(dataValue1.meetCondition(QueryCondition.Equals, [compareDataValue])).toBeTruthy();

      const dataValue2 = new UnknownDataValue('HeLLo');
      expect(dataValue2.meetCondition(QueryCondition.Equals, [compareDataValue])).toBeTruthy();

      const dataValue3 = new UnknownDataValue('helllo');
      expect(dataValue3.meetCondition(QueryCondition.Equals, [compareDataValue])).toBeFalsy();

      const dataValue4 = new UnknownDataValue(null);
      expect(dataValue4.meetCondition(QueryCondition.Equals, [{value: undefined}])).toBeTruthy();
    });

    it('not equals', () => {
      const compareDataValue = {value: 'hello'};
      const dataValue1 = new UnknownDataValue('hello');
      expect(dataValue1.meetCondition(QueryCondition.NotEquals, [compareDataValue])).toBeFalsy();

      const dataValue2 = new UnknownDataValue('HeLLo');
      expect(dataValue2.meetCondition(QueryCondition.NotEquals, [compareDataValue])).toBeFalsy();

      const dataValue3 = new UnknownDataValue('helllo');
      expect(dataValue3.meetCondition(QueryCondition.NotEquals, [compareDataValue])).toBeTruthy();
    });

    it('contains', () => {
      const compareDataValue = {value: 'lumeer'};
      const dataValue1 = new UnknownDataValue('klumEEr');
      expect(dataValue1.meetCondition(QueryCondition.Contains, [compareDataValue])).toBeTruthy();

      const dataValue2 = new UnknownDataValue('lumere');
      expect(dataValue2.meetCondition(QueryCondition.Contains, [compareDataValue])).toBeFalsy();

      const dataValue3 = new UnknownDataValue('one two three LUMEER is the best');
      expect(dataValue3.meetCondition(QueryCondition.Contains, [compareDataValue])).toBeTruthy();
    });

    it('starts with', () => {
      const compareDataValue = {value: 'slo'};
      const dataValue1 = new UnknownDataValue('SLOVAKIA');
      expect(dataValue1.meetCondition(QueryCondition.StartsWith, [compareDataValue])).toBeTruthy();

      const dataValue2 = new UnknownDataValue('saslova');
      expect(dataValue2.meetCondition(QueryCondition.StartsWith, [compareDataValue])).toBeFalsy();

      const dataValue3 = new UnknownDataValue('  slot');
      expect(dataValue3.meetCondition(QueryCondition.StartsWith, [compareDataValue])).toBeTruthy();
    });

    it('ends with', () => {
      const compareDataValue = {value: 'lala'};
      const dataValue1 = new UnknownDataValue('klala   ');
      expect(dataValue1.meetCondition(QueryCondition.EndsWith, [compareDataValue])).toBeTruthy();

      const dataValue2 = new UnknownDataValue('lalaka');
      expect(dataValue2.meetCondition(QueryCondition.EndsWith, [compareDataValue])).toBeFalsy();
    });

    it('is empty', () => {
      const dataValue1 = new UnknownDataValue('     ');
      expect(dataValue1.meetCondition(QueryCondition.IsEmpty, [])).toBeTruthy();

      const dataValue2 = new UnknownDataValue('  l  ');
      expect(dataValue2.meetCondition(QueryCondition.IsEmpty, [])).toBeFalsy();
    });

    it('is not empty', () => {
      const dataValue1 = new UnknownDataValue('     ');
      expect(dataValue1.meetCondition(QueryCondition.NotEmpty, [])).toBeFalsy();

      const dataValue2 = new UnknownDataValue('  l  ');
      expect(dataValue2.meetCondition(QueryCondition.NotEmpty, [])).toBeTruthy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(new UnknownDataValue('something').meetFullTexts(['THIN'])).toBeTruthy();
      expect(new UnknownDataValue('hinks').meetFullTexts(['THIN'])).toBeFalsy();
    });

    it('multiple', () => {
      expect(new UnknownDataValue('hey something to type').meetFullTexts(['hey', 'thin', 'pe', 'to'])).toBeTruthy();
      expect(new UnknownDataValue('some other words').meetFullTexts(['the', 'wor', 'meo'])).toBeFalsy();
    });
  });
});
