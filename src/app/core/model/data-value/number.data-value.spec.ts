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
import {NumberDataValue} from './number.data-value';
import {NumberConstraintConfig} from '../data/constraint-config';
import {LanguageTag} from '../data/language-tag';

describe('NumberDataValue', () => {
  const config: NumberConstraintConfig = {};

  describe('meet condition', () => {
    it('equals', () => {
      expect(new NumberDataValue('20', config).meetCondition(QueryCondition.Equals, [{value: 20}])).toBeTruthy();

      expect(new NumberDataValue('20.000', config).meetCondition(QueryCondition.Equals, [{value: 20}])).toBeTruthy();

      expect(new NumberDataValue('20.01', config).meetCondition(QueryCondition.Equals, [{value: 20}])).toBeFalsy();

      expect(new NumberDataValue('', config).meetCondition(QueryCondition.Equals, [{value: null}])).toBeTruthy();

      expect(new NumberDataValue(undefined, config).meetCondition(QueryCondition.Equals, [{value: null}])).toBeTruthy();

      expect(new NumberDataValue('10', config).meetCondition(QueryCondition.Equals, [{value: '5'}])).toBeFalsy();
    });

    it('not equals', () => {
      expect(new NumberDataValue('20', config).meetCondition(QueryCondition.NotEquals, [{value: 20}])).toBeFalsy();

      expect(
        new NumberDataValue(undefined, config).meetCondition(QueryCondition.NotEquals, [{value: null}])
      ).toBeFalsy();

      expect(new NumberDataValue(10, config).meetCondition(QueryCondition.NotEquals, [{value: null}])).toBeTruthy();

      expect(new NumberDataValue(10.001, config).meetCondition(QueryCondition.NotEquals, [{value: '10'}])).toBeTruthy();
    });

    it('greater than', () => {
      expect(new NumberDataValue('20', config).meetCondition(QueryCondition.GreaterThan, [{value: 20}])).toBeFalsy();

      expect(
        new NumberDataValue('20', config).meetCondition(QueryCondition.GreaterThanEquals, [{value: 20}])
      ).toBeTruthy();

      expect(new NumberDataValue(10, config).meetCondition(QueryCondition.GreaterThan, [{value: null}])).toBeFalsy();

      expect(new NumberDataValue(null, config).meetCondition(QueryCondition.GreaterThan, [{value: null}])).toBeFalsy();

      expect(new NumberDataValue(null, config).meetCondition(QueryCondition.GreaterThan, [{value: 10}])).toBeFalsy();

      expect(new NumberDataValue(10, config).meetCondition(QueryCondition.GreaterThan, [{value: 15}])).toBeFalsy();
    });

    it('lower than', () => {
      expect(new NumberDataValue('20', config).meetCondition(QueryCondition.LowerThan, [{value: 20}])).toBeFalsy();

      expect(
        new NumberDataValue('20', config).meetCondition(QueryCondition.LowerThanEquals, [{value: 20}])
      ).toBeTruthy();

      expect(new NumberDataValue(10, config).meetCondition(QueryCondition.LowerThan, [{value: null}])).toBeFalsy();

      expect(new NumberDataValue(null, config).meetCondition(QueryCondition.LowerThan, [{value: null}])).toBeFalsy();

      expect(new NumberDataValue(null, config).meetCondition(QueryCondition.LowerThan, [{value: 10}])).toBeFalsy();

      expect(new NumberDataValue(10, config).meetCondition(QueryCondition.LowerThan, [{value: 15}])).toBeTruthy();
    });

    it('between', () => {
      expect(
        new NumberDataValue('20', config).meetCondition(QueryCondition.Between, [{value: 20}, {value: 20}])
      ).toBeTruthy();

      expect(
        new NumberDataValue('20', config).meetCondition(QueryCondition.Between, [{value: 20}, {value: 17}])
      ).toBeFalsy();

      expect(
        new NumberDataValue('20', config).meetCondition(QueryCondition.Between, [{value: 10}, {value: 30}])
      ).toBeTruthy();

      expect(
        new NumberDataValue('20', config).meetCondition(QueryCondition.Between, [{value: 100}, {value: 120}])
      ).toBeFalsy();

      expect(
        new NumberDataValue(null, config).meetCondition(QueryCondition.Between, [{value: 20}, {value: 25}])
      ).toBeFalsy();
    });

    it('not between', () => {
      expect(
        new NumberDataValue('20', config).meetCondition(QueryCondition.NotBetween, [{value: 20}, {value: 20}])
      ).toBeFalsy();

      expect(
        new NumberDataValue('20', config).meetCondition(QueryCondition.NotBetween, [{value: 30}, {value: 50}])
      ).toBeTruthy();

      expect(
        new NumberDataValue('10', config).meetCondition(QueryCondition.NotBetween, [{value: 0}, {value: 30}])
      ).toBeFalsy();

      expect(
        new NumberDataValue(null, config).meetCondition(QueryCondition.NotBetween, [{value: 30}, {value: 50}])
      ).toBeFalsy();
    });

    it('is empty', () => {
      expect(new NumberDataValue('', config).meetCondition(QueryCondition.IsEmpty, [])).toBeTruthy();

      expect(new NumberDataValue('10', config).meetCondition(QueryCondition.IsEmpty, [])).toBeFalsy();

      expect(new NumberDataValue(null, config).meetCondition(QueryCondition.IsEmpty, [])).toBeTruthy();

      expect(new NumberDataValue(undefined, config).meetCondition(QueryCondition.IsEmpty, [])).toBeTruthy();
    });

    it('is not empty', () => {
      expect(new NumberDataValue('', config).meetCondition(QueryCondition.NotEmpty, [])).toBeFalsy();

      expect(new NumberDataValue('10', config).meetCondition(QueryCondition.NotEmpty, [])).toBeTruthy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(new NumberDataValue('10.00', config).meetFullTexts(['10'])).toBeTruthy();
      expect(new NumberDataValue('253.21', config).meetFullTexts(['22'])).toBeFalsy();
    });

    it('multiple', () => {
      expect(new NumberDataValue('10.456', config).meetFullTexts(['10', '45', '6'])).toBeTruthy();
      expect(new NumberDataValue('253.21', config).meetFullTexts(['25', '21', '22'])).toBeFalsy();
    });
  });

  describe('Format', () => {
    const emptyConfig: NumberConstraintConfig = {};
    it('Empty config', () => {
      expect(new NumberDataValue('10.11', emptyConfig).format()).toBe('10.11');
      expect(new NumberDataValue('10,11', emptyConfig).format()).toBe('10.11');
      expect(new NumberDataValue(10, emptyConfig).format()).toBe('10');

      expect(new NumberDataValue('10.11', emptyConfig, '10.11').serialize()).toBe('10.11');
      expect(new NumberDataValue('10,11', emptyConfig, '10,11').serialize()).toBe('10.11');
      expect(new NumberDataValue(10, emptyConfig, '10').serialize()).toBe('10');
    });

    const thousandSeparatedConfig: NumberConstraintConfig = {separated: true};
    const thousandSeparatedConfig2: NumberConstraintConfig = {decimals: 3, separated: true};
    it('Thousand separated config', () => {
      expect(new NumberDataValue('10.11', thousandSeparatedConfig).format()).toBe('10.11');
      expect(new NumberDataValue('10,11', thousandSeparatedConfig).format()).toBe('1,011');
      expect(new NumberDataValue('10,000', thousandSeparatedConfig).format()).toBe('10,000');
      expect(new NumberDataValue('10,000.12345', thousandSeparatedConfig2).format()).toBe('10,000.123');
      expect(new NumberDataValue('2,3.77777', thousandSeparatedConfig2).format()).toBe('23.778');

      expect(new NumberDataValue('10.11', thousandSeparatedConfig, '10.11').serialize()).toBe('10.11');
      expect(new NumberDataValue('10,11', thousandSeparatedConfig, '10,11').serialize()).toBe('1011');
      expect(new NumberDataValue('10,000', thousandSeparatedConfig, '10,000').serialize()).toBe('10000');
      expect(new NumberDataValue('10,000.12345', thousandSeparatedConfig2, '10,000.12345').serialize()).toBe(
        '10000.12345'
      );
    });

    const slovakCurrencyConfig: NumberConstraintConfig = {currency: LanguageTag.Slovak};
    it('Currency config', () => {
      expect(new NumberDataValue('10.11', slovakCurrencyConfig).format()).toBe('10,11€');
      expect(new NumberDataValue('10,11', slovakCurrencyConfig).format()).toBe('10,11€');
      expect(new NumberDataValue(10, slovakCurrencyConfig).format()).toBe('10€');

      expect(new NumberDataValue('10.11', slovakCurrencyConfig, '10.11').serialize()).toBe('10.11');
      expect(new NumberDataValue('10,11', slovakCurrencyConfig, '10,11').serialize()).toBe('10.11');
    });

    const usCurrencyConfig: NumberConstraintConfig = {currency: LanguageTag.USA};
    it('Currency config', () => {
      expect(new NumberDataValue('10.11', usCurrencyConfig).format()).toBe('$10.11');
      expect(new NumberDataValue('10,11', usCurrencyConfig).format()).toBe('$1011');
      expect(new NumberDataValue(10, usCurrencyConfig).format()).toBe('$10');

      expect(new NumberDataValue('10.11', usCurrencyConfig, '10.11').serialize()).toBe('10.11');
      expect(new NumberDataValue('10,11', usCurrencyConfig, '10,11').serialize()).toBe('1011');
    });
  });
});
