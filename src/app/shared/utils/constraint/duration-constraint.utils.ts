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
import {isNumeric, toNumber} from '../common.utils';

export function durationConstraintUnitMaxValue(unit: DurationUnit): number {
  switch (unit) {
    case DurationUnit.Weeks:
      return 7;
    case DurationUnit.Days:
      return 24;
    case DurationUnit.Hours:
      return 60;
    case DurationUnit.Minutes:
      return 60;
    case DurationUnit.Seconds:
      return 1000;
  }
  return 1;
}

export function getDefaultDurationUnitConversion(type: DurationType, unit: DurationUnit): number {
  switch (unit) {
    case DurationUnit.Weeks:
      return type === DurationType.Work ? 5 : 7; // to days
    case DurationUnit.Days:
      return type === DurationType.Work ? 8 : 24; // to hours
    case DurationUnit.Hours:
      return 60; // to minutes
    case DurationUnit.Minutes:
      return 60; // to seconds
    case DurationUnit.Seconds:
      return 1000; // to milliseconds
  }
}

export function getDurationSaveValue(
  value: any,
  config: DurationConstraintConfig,
  durationMap: Record<DurationUnit, string>
): any {
  if (isDurationDataValueValid(value, durationMap)) {
    if (isNumeric(value)) {
      return toNumber(value);
    } else if (isDurationValidByGlobalLetters(value)) {
      const durationToMillisMap = getDurationUnitToMillisMap(config);
      return parseValueToDurationValue(value, durationToMillisMap);
    } else if (isDurationValidByNativeLetters(value, durationMap)) {
      const durationToMillisMap = getDurationUnitToMillisMap(config, durationMap);
      return parseValueToDurationValue(value, durationToMillisMap);
    }

    return 0;
  }
  return String(value || '');
}

function getDurationUnitToMillisMap(
  config: DurationConstraintConfig,
  durationMap?: Record<DurationUnit, string>
): Record<string, number> {
  return Object.values(DurationUnit).reduce((map, unit) => {
    const value = getDurationUnitToMillis(unit, config.type || DurationType.Work, config.conversions);
    const key = (durationMap && durationMap[unit]) || unit;

    map[key] = value;

    return map;
  }, {});
}

function getDurationUnitToMillis(
  unit: DurationUnit,
  type: DurationType,
  conversions: Record<DurationUnit, number>
): number {
  const conversion = (conversions && conversions[unit]) || getDefaultDurationUnitConversion(type, unit);
  switch (unit) {
    case DurationUnit.Weeks:
    case DurationUnit.Days:
    case DurationUnit.Hours:
    case DurationUnit.Minutes:
      const descendantUnit = getDescendantDurationUnit(unit);
      return conversion * getDurationUnitToMillis(descendantUnit, type, conversions);
    case DurationUnit.Seconds:
      return conversion;
    default:
      return 1;
  }
}

function getDescendantDurationUnit(unit: DurationUnit): DurationUnit | null {
  switch (unit) {
    case DurationUnit.Weeks:
      return DurationUnit.Days;
    case DurationUnit.Days:
      return DurationUnit.Hours;
    case DurationUnit.Hours:
      return DurationUnit.Minutes;
    case DurationUnit.Minutes:
      return DurationUnit.Seconds;
    default:
      return null;
  }
}

function parseValueToDurationValue(value: any, unitToMillisMap: Record<string, number>): number {
  const lettersRegexPart = Object.keys(unitToMillisMap).join('|');
  const regex = new RegExp(`\\d*(${lettersRegexPart})`, 'g');

  const groups = (value || '').trim().match(regex) || [];

  let millis = 0;
  for (const group of groups) {
    const millisPerGroup = unitToMillisMap[group[group.length - 1]];
    millis += millisPerGroup * (parseInt(group, 10) || 1);
  }
  return millis;
}

export function isDurationDataValueValid(value: any, durationMap: Record<DurationUnit, string>): any {
  return (
    isNumeric(value) || isDurationValidByGlobalLetters(value) || isDurationValidByNativeLetters(value, durationMap)
  );
}

function isDurationValidByGlobalLetters(value: any): boolean {
  const stringValue = (value || '').toString().trim();
  const globalLetters = Object.values(DurationUnit);
  const globalRegex = durationInvalidityTestRegex(globalLetters);
  return !stringValue.match(globalRegex);
}

function isDurationValidByNativeLetters(value: any, durationMap: Record<DurationUnit, string>): boolean {
  const stringValue = (value || '').toString().trim();
  const nativeLetters = Object.values(durationMap || {});
  const nativeRegex = durationInvalidityTestRegex(nativeLetters);
  return !stringValue.match(nativeRegex);
}

function durationInvalidityTestRegex(letters: string[]): RegExp {
  return new RegExp(`[^${letters.join('')}0-9]`, 'g');
}

export function formatDurationDataValue(
  value: any,
  config: DurationConstraintConfig,
  durationMap: Record<DurationUnit, string>
) {
  return value;
}
