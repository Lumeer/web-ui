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

import {SelectConstraintConfig} from '../data/constraint-config';
import {SelectDataValue} from './select.data-value';
import {ConditionType} from '../attribute-filter';

describe('SelectDataValue', () => {
  const config: SelectConstraintConfig = {
    multi: true,
    displayValues: true,
    options: [
      {value: '0', displayValue: 'Hey'},
      {value: '1', displayValue: 'Day'},
      {value: '2', displayValue: 'May'},
      {value: '3', displayValue: 'No'},
    ],
  };

  describe('meet condition', () => {
    it('has some', () => {
      expect(new SelectDataValue(['0', '5'], config).meetCondition(ConditionType.HasSome, [{value: '0'}])).toBeTruthy();
      expect(new SelectDataValue(['4', '5'], config).meetCondition(ConditionType.HasSome, [{value: '0'}])).toBeFalsy();
      expect(
        new SelectDataValue(['0', '1', '2', '3'], config).meetCondition(ConditionType.HasSome, [
          {value: ['0', '1', '2', '3', '4']},
        ])
      ).toBeTruthy();
      expect(new SelectDataValue(['3', '1'], config).meetCondition(ConditionType.HasSome, [{value: '0'}])).toBeFalsy();
    });

    it('has none of ', () => {
      expect(
        new SelectDataValue(['0', '1', '2'], config).meetCondition(ConditionType.HasNoneOf, [{value: '3'}])
      ).toBeTruthy();
      expect(
        new SelectDataValue(['0', '1', '2'], config).meetCondition(ConditionType.HasNoneOf, [{value: ['3', '4', '5']}])
      ).toBeTruthy();
      expect(
        new SelectDataValue(['0', '1', '2', '3'], config).meetCondition(ConditionType.HasNoneOf, [{value: ['0', '5']}])
      ).toBeFalsy();
      expect(
        new SelectDataValue(['3', '1'], config).meetCondition(ConditionType.HasNoneOf, [{value: '1'}])
      ).toBeFalsy();
    });

    it('in', () => {
      expect(
        new SelectDataValue(['a'], config).meetCondition(ConditionType.In, [{value: ['a', 'b', 'c']}])
      ).toBeTruthy();
      expect(
        new SelectDataValue(['a', 'b'], config).meetCondition(ConditionType.In, [{value: ['a', 'b', 'c']}])
      ).toBeTruthy();
      expect(
        new SelectDataValue(['a', 'c', 'b'], config).meetCondition(ConditionType.In, [{value: ['a', 'b', 'c']}])
      ).toBeTruthy();
      expect(
        new SelectDataValue(['a', 'b', 'c', 'd'], config).meetCondition(ConditionType.In, [{value: ['a', 'b', 'c']}])
      ).toBeFalsy();
    });

    it('has all', () => {
      expect(
        new SelectDataValue(['a'], config).meetCondition(ConditionType.HasAll, [{value: ['a', 'b', 'c']}])
      ).toBeFalsy();
      expect(
        new SelectDataValue(['a', 'b'], config).meetCondition(ConditionType.HasAll, [{value: ['a', 'b', 'c']}])
      ).toBeFalsy();
      expect(
        new SelectDataValue(['a', 'c', 'b'], config).meetCondition(ConditionType.HasAll, [{value: ['a', 'b', 'c']}])
      ).toBeTruthy();
      expect(
        new SelectDataValue(['a', 'b', 'c', 'd'], config).meetCondition(ConditionType.HasAll, [
          {value: ['a', 'b', 'c']},
        ])
      ).toBeTruthy();
    });

    it('is empty', () => {
      expect(new SelectDataValue('0', config).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();
      expect(new SelectDataValue('  ', config).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
      expect(new SelectDataValue(null, config).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
    });

    it('is not empty', () => {
      expect(new SelectDataValue(' 0', config).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();
      expect(new SelectDataValue(null, config).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();
      expect(new SelectDataValue('  ', config).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(new SelectDataValue('0', config).meetFullTexts(['he'])).toBeTruthy();
      expect(new SelectDataValue(['0', '1', '2'], config).meetFullTexts(['He', 'da', 'ma'])).toBeTruthy();
      expect(new SelectDataValue(['0', '3', '5'], config).meetFullTexts(['da'])).toBeFalsy();
    });
  });
});
