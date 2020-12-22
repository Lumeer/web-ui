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

import {ColorDataValue} from './color.data-value';
import {ColorConstraintConfig} from '../data/constraint-config';
import {ConditionType} from '../attribute-filter';

describe('ColorDataValue', () => {
  const config: ColorConstraintConfig = {};

  describe('meet condition', () => {
    it('equals', () => {
      expect(new ColorDataValue('red', config).meetCondition(ConditionType.Equals, [{value: '#ff0000'}])).toBeTruthy();
      expect(new ColorDataValue('red', config).meetCondition(ConditionType.Equals, [{value: 'red'}])).toBeTruthy();
      expect(new ColorDataValue('red', config).meetCondition(ConditionType.Equals, [{value: '#ff0001'}])).toBeFalsy();
      expect(
        new ColorDataValue('white', config).meetCondition(ConditionType.Equals, [{value: '#ffffff'}])
      ).toBeTruthy();
      expect(
        new ColorDataValue('#000000', config).meetCondition(ConditionType.Equals, [{value: 'black'}])
      ).toBeTruthy();
      expect(new ColorDataValue('#000', config).meetCondition(ConditionType.Equals, [{value: 'black'}])).toBeTruthy();
    });

    it('not equals', () => {
      expect(
        new ColorDataValue('red', config).meetCondition(ConditionType.NotEquals, [{value: '#ff0001'}])
      ).toBeTruthy();
      expect(
        new ColorDataValue('red', config).meetCondition(ConditionType.NotEquals, [{value: '#ff0000'}])
      ).toBeFalsy();
      expect(
        new ColorDataValue('white', config).meetCondition(ConditionType.NotEquals, [{value: 'black'}])
      ).toBeTruthy();
      expect(
        new ColorDataValue('white', config).meetCondition(ConditionType.NotEquals, [{value: '#ffffffff'}])
      ).toBeTruthy();
    });
    it('is empty', () => {
      expect(new ColorDataValue('     ', config).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
      expect(new ColorDataValue(' red ', config).meetCondition(ConditionType.IsEmpty, [])).toBeFalsy();
      expect(new ColorDataValue(null, config).meetCondition(ConditionType.IsEmpty, [])).toBeTruthy();
    });

    it('is not empty', () => {
      expect(new ColorDataValue('#000000', config).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();
      expect(new ColorDataValue('red', config).meetCondition(ConditionType.NotEmpty, [])).toBeTruthy();
      expect(new ColorDataValue(null, config).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();
      expect(new ColorDataValue('  ', config).meetCondition(ConditionType.NotEmpty, [])).toBeFalsy();
    });
  });

  describe('meet fultexts', () => {
    it('single', () => {
      expect(new ColorDataValue('#000000', config).meetFullTexts(['black'])).toBeTruthy();
      expect(new ColorDataValue('#000000', config).meetFullTexts(['#000000'])).toBeTruthy();
      expect(new ColorDataValue('#000000', config).meetFullTexts(['bl'])).toBeTruthy();
      expect(new ColorDataValue('#000000', config).meetFullTexts(['001'])).toBeFalsy();
      expect(new ColorDataValue('black', config).meetFullTexts(['black'])).toBeTruthy();
      expect(new ColorDataValue('black', config).meetFullTexts(['#000'])).toBeTruthy();
    });
  });
});
