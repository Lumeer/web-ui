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
import {ColorDataValue} from './color.data-value';
import {ColorConstraintConfig} from '../data/constraint-config';

describe('ColorDataValue', () => {
  const config: ColorConstraintConfig = {};

  describe('meet condition', () => {
    it('equals', () => {
      expect(new ColorDataValue('red', config).meetCondition(QueryCondition.Equals, [{value: '#ff0000'}])).toBeTruthy();
      expect(new ColorDataValue('red', config).meetCondition(QueryCondition.Equals, [{value: 'red'}])).toBeTruthy();
      expect(new ColorDataValue('red', config).meetCondition(QueryCondition.Equals, [{value: '#ff0001'}])).toBeFalsy();
      expect(
        new ColorDataValue('white', config).meetCondition(QueryCondition.Equals, [{value: '#ffffff'}])
      ).toBeTruthy();
      expect(
        new ColorDataValue('#000000', config).meetCondition(QueryCondition.Equals, [{value: 'black'}])
      ).toBeTruthy();
      expect(new ColorDataValue('#000', config).meetCondition(QueryCondition.Equals, [{value: 'black'}])).toBeTruthy();
    });

    it('not equals', () => {
      expect(
        new ColorDataValue('red', config).meetCondition(QueryCondition.NotEquals, [{value: '#ff0001'}])
      ).toBeTruthy();
      expect(
        new ColorDataValue('red', config).meetCondition(QueryCondition.NotEquals, [{value: '#ff0000'}])
      ).toBeFalsy();
      expect(
        new ColorDataValue('white', config).meetCondition(QueryCondition.NotEquals, [{value: 'black'}])
      ).toBeTruthy();
      expect(
        new ColorDataValue('white', config).meetCondition(QueryCondition.NotEquals, [{value: '#ffffffff'}])
      ).toBeTruthy();
    });
    it('is empty', () => {
      expect(new ColorDataValue('     ', config).meetCondition(QueryCondition.IsEmpty, [])).toBeTruthy();
      expect(new ColorDataValue(' red ', config).meetCondition(QueryCondition.IsEmpty, [])).toBeFalsy();
      expect(new ColorDataValue(null, config).meetCondition(QueryCondition.IsEmpty, [])).toBeTruthy();
    });

    it('is not empty', () => {
      expect(new ColorDataValue('#000000', config).meetCondition(QueryCondition.NotEmpty, [])).toBeTruthy();
      expect(new ColorDataValue('red', config).meetCondition(QueryCondition.NotEmpty, [])).toBeTruthy();
      expect(new ColorDataValue(null, config).meetCondition(QueryCondition.NotEmpty, [])).toBeFalsy();
      expect(new ColorDataValue('  ', config).meetCondition(QueryCondition.NotEmpty, [])).toBeFalsy();
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
