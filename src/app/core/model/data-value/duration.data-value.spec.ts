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

import {DurationUnitsMap} from '../data/constraint';
import {DurationConstraintConfig, DurationType, DurationUnit} from '../data/constraint-config';
import {DurationDataValue} from './duration.data-value';

describe('DurationDataValue', () => {
  const durationUnitsMap: DurationUnitsMap = {
    [DurationUnit.Weeks]: 't',
    [DurationUnit.Days]: 'd',
    [DurationUnit.Hours]: 'h',
    [DurationUnit.Minutes]: 'm',
    [DurationUnit.Seconds]: 's',
  };

  const config: DurationConstraintConfig = {
    type: DurationType.Custom,
    conversions: {
      [DurationUnit.Weeks]: 5,
      [DurationUnit.Days]: 8,
      [DurationUnit.Hours]: 60,
      [DurationUnit.Minutes]: 60,
      [DurationUnit.Seconds]: 1000,
    },
  };

  const secondToMillis = 1000;
  const minuteToMillis = 60 * secondToMillis;
  const hourToMillis = 60 * minuteToMillis;
  const dayToMillis = 8 * hourToMillis;
  const weekToMillis = 5 * dayToMillis;

  describe('format()', () => {
    it('should format duration value weeks', () => {
      const dataValue = new DurationDataValue('10w', config, {durationUnitsMap});
      expect(dataValue.format()).toEqual('10t');
    });

    it('should format duration value weeks group with days', () => {
      const dataValue = new DurationDataValue('w21d', config, {durationUnitsMap});
      expect(dataValue.format()).toEqual('5t1d');
    });

    it('should format duration value weeks group with days', () => {
      const value = String(4 * weekToMillis + 3 * hourToMillis + 2 * secondToMillis);
      const dataValue = new DurationDataValue(value, config, {durationUnitsMap});
      expect(dataValue.format()).toEqual('4t3h2s');
    });

    it('should format duration invalid value', () => {
      const dataValue = new DurationDataValue('5w4e4s', config, {durationUnitsMap});
      expect(dataValue.format()).toEqual('5w4e4s');
    });

    it('should format duration value with spaces', () => {
      const dataValue = new DurationDataValue('3w   4d    5h 3s   ', config, {
        durationUnitsMap,
      });
      expect(dataValue.format()).toEqual('3t4d5h3s');
    });
  });

  describe('serialize()', () => {
    it('should parse string by invalid value', () => {
      const dataValue = new DurationDataValue('1w3s4g', config, {durationUnitsMap});
      expect(dataValue.serialize()).toEqual('1w3s4g');
    });

    it('should parse number by number value', () => {
      const dataValue = new DurationDataValue(3124141, config, {durationUnitsMap});
      expect(dataValue.serialize()).toEqual(3124141);
    });

    it('should parse number by weeks only', () => {
      const dataValue = new DurationDataValue('4w', config, {durationUnitsMap});
      expect(dataValue.serialize()).toEqual(4 * weekToMillis);
    });

    it('should parse number by weeks only without number', () => {
      const dataValue = new DurationDataValue('www', config, {durationUnitsMap});
      expect(dataValue.serialize()).toEqual(3 * weekToMillis);
    });

    it('should parse number by weeks and minutes', () => {
      const dataValue = new DurationDataValue('8w20m', config, {durationUnitsMap});
      expect(dataValue.serialize()).toEqual(8 * weekToMillis + 20 * minuteToMillis);
    });

    it('should parse number by all units', () => {
      const dataValue = new DurationDataValue('wwdd3h4m5s', config, {durationUnitsMap});
      const serializedValue =
        2 * weekToMillis + 2 * dayToMillis + 3 * hourToMillis + 4 * minuteToMillis + 5 * secondToMillis;
      expect(dataValue.serialize()).toEqual(serializedValue);
    });

    it('should parse number by repeating units', () => {
      const dataValue = new DurationDataValue('2w3d4mww4d9wms', config, {durationUnitsMap});
      const serializedValue = 13 * weekToMillis + 7 * dayToMillis + 5 * minuteToMillis + secondToMillis;
      expect(dataValue.serialize()).toEqual(serializedValue);
    });
  });

  describe('isValid()', () => {
    it('should be valid', () => {
      const dataValue = new DurationDataValue('1w3d400h5m2s', config, {durationUnitsMap});
      expect(dataValue.isValid()).toEqual(true);
    });

    it('should be valid without numbers', () => {
      const dataValue = new DurationDataValue('wwwwddddhh', config, {durationUnitsMap});
      expect(dataValue.isValid()).toEqual(true);
    });

    it('should be valid by translation', () => {
      const dataValue = new DurationDataValue('1t3d40h5m2s', config, {durationUnitsMap});
      expect(dataValue.isValid()).toEqual(true);
    });

    it('should be valid by translation without numbers', () => {
      const dataValue = new DurationDataValue('tttttdddhhmm', config, {durationUnitsMap});
      expect(dataValue.isValid()).toEqual(true);
    });

    it('should not be valid', () => {
      const dataValue = new DurationDataValue('1w3d4h7u5s', config, {durationUnitsMap});
      expect(dataValue.isValid()).toEqual(false);
    });

    it('should not be valid II', () => {
      const dataValue = new DurationDataValue('p1wddd', config, {durationUnitsMap});
      expect(dataValue.isValid()).toEqual(false);
    });

    it('should not be valid by translation', () => {
      const dataValue = new DurationDataValue('1w1t4t', config, {durationUnitsMap});
      expect(dataValue.isValid()).toEqual(false);
    });
  });
});
