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

import {DurationConstraintConfig, DurationType, DurationUnit} from '../../../core/model/data/constraint-config';
import {formatDurationDataValue, getDurationSaveValue, isDurationDataValueValid} from './duration-constraint.utils';

describe('duration utils', () => {
  const durationMap = {
    [DurationUnit.Weeks]: 't',
    [DurationUnit.Days]: 'd',
    [DurationUnit.Hours]: 'h',
    [DurationUnit.Minutes]: 'm',
    [DurationUnit.Seconds]: 's',
  };

  it('should be valid', () => {
    expect(isDurationDataValueValid('1w3d400h5m2s', durationMap)).toEqual(true);
  });

  it('should be valid without numbers', () => {
    expect(isDurationDataValueValid('wwwwddddhh', durationMap)).toEqual(true);
  });

  it('should be valid by translation', () => {
    expect(isDurationDataValueValid('1t3d40h5m2s', durationMap)).toEqual(true);
  });

  it('should be valid by translation without numbers', () => {
    expect(isDurationDataValueValid('tttttdddhhmm', durationMap)).toEqual(true);
  });

  it('should not be valid', () => {
    expect(isDurationDataValueValid('1w3d4h7u5s', durationMap)).toEqual(false);
  });

  it('should not be valid II', () => {
    expect(isDurationDataValueValid('p1wddd', durationMap)).toEqual(false);
  });

  it('should not be valid by translation', () => {
    expect(isDurationDataValueValid('1w1t4t', durationMap)).toEqual(false);
  });

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

  it('should parse string by invalid value', () => {
    expect(getDurationSaveValue('1w3s4g', config, durationMap)).toEqual('1w3s4g');
  });

  it('should parse number by number value', () => {
    expect(getDurationSaveValue(3124141, config, durationMap)).toEqual(String(3124141));
  });

  it('should parse number by weeks only', () => {
    expect(getDurationSaveValue('4w', config, durationMap)).toEqual(String(4 * weekToMillis));
  });

  it('should parse number by weeks only without number', () => {
    expect(getDurationSaveValue('www', config, durationMap)).toEqual(String(3 * weekToMillis));
  });

  it('should parse number by weeks and minutes', () => {
    expect(getDurationSaveValue('8w20m', config, durationMap)).toEqual(String(8 * weekToMillis + 20 * minuteToMillis));
  });

  it('should parse number by all units', () => {
    expect(getDurationSaveValue('wwdd3h4m5s', config, durationMap)).toEqual(
      String(2 * weekToMillis + 2 * dayToMillis + 3 * hourToMillis + 4 * minuteToMillis + 5 * secondToMillis)
    );
  });

  it('should parse number by repeating units', () => {
    expect(getDurationSaveValue('2w3d4mww4d9wms', config, durationMap)).toEqual(
      String(13 * weekToMillis + 7 * dayToMillis + 5 * minuteToMillis + secondToMillis)
    );
  });

  it('should format duration value weeks', () => {
    expect(formatDurationDataValue('10w', config, durationMap)).toEqual('10t');
  });

  it('should format duration value weeks group with days native', () => {
    expect(formatDurationDataValue('w21d', config, durationMap)).toEqual('5t1d');
  });

  it('should format duration value weeks group with days translated', () => {
    expect(
      formatDurationDataValue(String(4 * weekToMillis + 3 * hourToMillis + 2 * secondToMillis), config, durationMap)
    ).toEqual('4t3h2s');
  });

  it('should format duration invalid value', () => {
    expect(formatDurationDataValue('5w4e4s', config, durationMap)).toEqual('5w4e4s');
  });

  it('should format duration value with spaces', () => {
    expect(formatDurationDataValue('3w   4d    5h 3s   ', config, durationMap)).toEqual('3t4d5h3s');
  });
});
