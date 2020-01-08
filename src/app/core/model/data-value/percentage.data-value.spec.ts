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

import {PercentageConstraintConfig} from '../data/constraint-config';
import {PercentageDataValue} from './percentage.data-value';

describe('PercentageDataValue', () => {
  const basicPercentage = {} as PercentageConstraintConfig;

  it('undefined value', () => {
    const dataValue = new PercentageDataValue(undefined, basicPercentage);
    expect(dataValue.format()).toEqual('');
    expect(dataValue.serialize()).toEqual('');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('null value', () => {
    const dataValue = new PercentageDataValue(null, basicPercentage);
    expect(dataValue.format()).toEqual('');
    expect(dataValue.serialize()).toEqual('');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('empty string value', () => {
    const dataValue = new PercentageDataValue('', basicPercentage);
    expect(dataValue.format()).toEqual('');
    expect(dataValue.serialize()).toEqual('');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('zero number value', () => {
    const dataValue = new PercentageDataValue(0, basicPercentage);
    expect(dataValue.format()).toEqual('0%');
    expect(dataValue.serialize()).toEqual(0);
    expect(dataValue.isValid()).toEqual(true);
  });

  it('zero string value', () => {
    const dataValue = new PercentageDataValue('0', basicPercentage);
    expect(dataValue.format()).toEqual('0%');
    expect(dataValue.serialize()).toEqual(0);
    expect(dataValue.isValid()).toEqual(true);
  });

  it('integer number value', () => {
    const dataValue = new PercentageDataValue(1, basicPercentage);
    expect(dataValue.format()).toEqual('100%');
    expect(dataValue.serialize()).toEqual(1);
    expect(dataValue.isValid()).toEqual(true);
  });

  it('integer string value', () => {
    const dataValue = new PercentageDataValue('1', basicPercentage);
    expect(dataValue.format()).toEqual('100%');
    expect(dataValue.serialize()).toEqual(1);
    expect(dataValue.isValid()).toEqual(true);
  });

  it('decimal number value', () => {
    const dataValue = new PercentageDataValue(0.5, basicPercentage);
    expect(dataValue.format()).toEqual('50%');
    expect(dataValue.serialize()).toEqual('0.5');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('decimal string value', () => {
    const dataValue = new PercentageDataValue('0.75', basicPercentage);
    expect(dataValue.format()).toEqual('75%');
    expect(dataValue.serialize()).toEqual('0.75');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('integer string value with symbol', () => {
    const dataValue = new PercentageDataValue('42%', basicPercentage);
    expect(dataValue.format()).toEqual('42%');
    expect(dataValue.serialize()).toEqual('0.42');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('decimal string value with symbol', () => {
    const dataValue = new PercentageDataValue('66.66%', basicPercentage);
    expect(dataValue.format()).toEqual('67%');
    expect(dataValue.serialize()).toEqual('0.67');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('should return invalid string', () => {
    const dataValue = new PercentageDataValue('abc', basicPercentage);
    expect(dataValue.format()).toEqual('abc');
    expect(dataValue.serialize()).toEqual('abc');
    expect(dataValue.isValid()).toEqual(false);
  });

  it('should parse empty value', () => {
    const dataValue = new PercentageDataValue('', basicPercentage).parseInput('');
    expect(dataValue.format()).toEqual('');
    expect(dataValue.serialize()).toEqual('');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('should parse integer value', () => {
    const dataValue = new PercentageDataValue('', basicPercentage).parseInput('66');
    expect(dataValue.format()).toEqual('66');
    expect(dataValue.serialize()).toEqual('0.66');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('should parse decimal value', () => {
    const dataValue = new PercentageDataValue('', basicPercentage).parseInput('66.66');
    expect(dataValue.format()).toEqual('66.66');
    expect(dataValue.serialize()).toEqual('0.67');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('should parse decimal value with symbol', () => {
    const dataValue = new PercentageDataValue('', basicPercentage).parseInput('66.66%');
    expect(dataValue.format()).toEqual('66.66%');
    expect(dataValue.serialize()).toEqual('0.67');
    expect(dataValue.isValid()).toEqual(true);
  });

  const integerPercentage = {decimals: 0} as PercentageConstraintConfig;

  it('should keep integer value', () => {
    const dataValue = new PercentageDataValue('0.5', integerPercentage);
    expect(dataValue.format()).toEqual('50%');
    expect(dataValue.serialize()).toEqual('0.5');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('should round decimal value to integer', () => {
    const dataValue = new PercentageDataValue(0.666, integerPercentage);
    expect(dataValue.format()).toEqual('67%');
    expect(dataValue.serialize()).toEqual('0.67');
    expect(dataValue.isValid()).toEqual(true);
  });

  const decimalPercentage = {decimals: 4} as PercentageConstraintConfig;

  it('should add missing zeroes', () => {
    const dataValue = new PercentageDataValue('0.75', decimalPercentage);
    expect(dataValue.format()).toEqual('75%');
    expect(dataValue.serialize()).toEqual('0.75');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('should round down decimal value', () => {
    const dataValue = new PercentageDataValue(0.33333333, decimalPercentage);
    expect(dataValue.format()).toEqual('33.3333%');
    expect(dataValue.serialize()).toEqual('0.333333');
    expect(dataValue.isValid()).toEqual(true);
  });

  it('should round up decimal value', () => {
    const dataValue = new PercentageDataValue(0.66666666, decimalPercentage);
    expect(dataValue.format()).toEqual('66.6667%');
    expect(dataValue.serialize()).toEqual('0.666667');
    expect(dataValue.isValid()).toEqual(true);
  });
});
