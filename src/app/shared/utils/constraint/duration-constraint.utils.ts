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
import {isNotNullOrUndefined, isNumeric, toNumber} from '../common.utils';
import {DurationUnitsMap} from '../../../core/model/data/constraint';
import Big, {Comparison, RoundingMode} from 'big.js';

export const sortedDurationUnits = [
  DurationUnit.Weeks,
  DurationUnit.Days,
  DurationUnit.Hours,
  DurationUnit.Minutes,
  DurationUnit.Seconds,
];

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
  durationUnitsMap: DurationUnitsMap
): any {
  if (isDurationDataValueValid(value, durationUnitsMap)) {
    if (isNumeric(value)) {
      const bigValue = convertToBig(value);
      if (bigValue) {
        return bigValue.toFixed(0);
      }
      return toNumber(value);
    } else if (isDurationValidByNativeLetters(value, durationUnitsMap)) {
      const durationToMillisMap = getDurationUnitToMillisMap(config, durationUnitsMap);
      return parseValueToDurationValue(value, durationToMillisMap);
    } else if (isDurationValidByGlobalLetters(value)) {
      const durationToMillisMap = getDurationUnitToMillisMap(config);
      return parseValueToDurationValue(value, durationToMillisMap);
    }

    return 0;
  }
  return String(value || '');
}

function getDurationUnitToMillisMap(
  config: DurationConstraintConfig,
  durationUnitsMap?: DurationUnitsMap
): Record<string, number> {
  return Object.values(DurationUnit).reduce((map, unit) => {
    const value = getDurationUnitToMillis(unit, config.type || DurationType.Work, config.conversions);
    const key = (durationUnitsMap && durationUnitsMap[unit]) || unit;

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
      const descendantUnit = getNextDurationUnit(unit);
      return conversion * getDurationUnitToMillis(descendantUnit, type, conversions);
    case DurationUnit.Seconds:
      return conversion;
    default:
      return 1;
  }
}

function getNextDurationUnit(unit: DurationUnit): DurationUnit | null {
  const index = sortedDurationUnits.indexOf(unit);
  return sortedDurationUnits[index + 1];
}

export function getPreviousDurationUnit(unit: DurationUnit): DurationUnit | null {
  const index = sortedDurationUnits.indexOf(unit);
  return sortedDurationUnits[index - 1];
}

function parseValueToDurationValue(value: any, unitToMillisMap: Record<string, number>): string {
  const lettersRegexPart = Object.keys(unitToMillisMap).join('|');
  const regex = new RegExp(`\\d*(${lettersRegexPart})`, 'g');

  const groups = prepareDurationValue(value).match(regex) || [];

  let millis = new Big(0);
  for (const group of groups) {
    const millisPerGroup = new Big(unitToMillisMap[group[group.length - 1]]);
    const groupNumber = group.replace(/[^\d]/g, '').trim();
    const multiplier = convertToBig(groupNumber, 1);
    millis = millis.add(millisPerGroup.times(multiplier));
  }
  return millis.toFixed(0);
}

export function convertToBig(value: any, defaultValue?: number): Big {
  try {
    return new Big(String(value));
  } catch (e) {
    return isNotNullOrUndefined(defaultValue) ? new Big(defaultValue) : null;
  }
}

export function isDurationDataValueValid(value: any, durationUnitsMap: DurationUnitsMap): any {
  return (
    (isNumeric(value) && toNumber(value) >= 0) ||
    isDurationValidByGlobalLetters(value) ||
    isDurationValidByNativeLetters(value, durationUnitsMap)
  );
}

function isDurationValidByGlobalLetters(value: any): boolean {
  const stringValue = prepareDurationValue(value);
  const globalLetters = Object.values(DurationUnit);
  const globalRegex = durationInvalidityTestRegex(globalLetters);
  return !stringValue.match(globalRegex);
}

function prepareDurationValue(value: any): string {
  return (value || '')
    .toString()
    .trim()
    .replace(/\s/g, '');
}

function isDurationValidByNativeLetters(value: any, durationUnitsMap: DurationUnitsMap): boolean {
  const stringValue = prepareDurationValue(value);
  const nativeLetters = Object.values(durationUnitsMap || {});
  const nativeRegex = durationInvalidityTestRegex(nativeLetters);
  return !stringValue.match(nativeRegex);
}

function durationInvalidityTestRegex(letters: string[]): RegExp {
  return new RegExp(`[^${letters.join('')}0-9]`, 'g');
}

export function formatDurationDataValue(
  value: any,
  config: DurationConstraintConfig,
  durationUnitsMap: DurationUnitsMap,
  maxUnits?: number
): string {
  const saveValue = getDurationSaveValue(value, config, durationUnitsMap);
  if (isNumeric(saveValue) && toNumber(saveValue) >= 0) {
    const durationToMillisMap = getDurationUnitToMillisMap(config);
    let currentDuration = convertToBig(saveValue, 0);
    let usedNumUnits = 0;
    const maximumUnits = maxUnits || Number.MAX_SAFE_INTEGER;

    let durationUnits = [...sortedDurationUnits];
    if (config.maxUnit) {
      const index = durationUnits.indexOf(config.maxUnit);
      durationUnits = durationUnits.slice(index, index + 2);
    }

    const reducedValue = durationUnits.reduce((result, unit) => {
      const unitToMillis = durationToMillisMap[unit];
      if (unitToMillis) {
        const unitToMillisBig = new Big(unitToMillis);
        let numUnits = currentDuration.div(unitToMillisBig).round(0, RoundingMode.RoundDown);

        if (usedNumUnits >= maximumUnits) {
          return result;
        }

        currentDuration = currentDuration.sub(numUnits.times(unitToMillisBig));

        // when maxUnits is set, rounding is needed
        if (usedNumUnits + 1 === maximumUnits && currentDuration.cmp(unitToMillisBig.div(2)) === Comparison.GT) {
          numUnits = numUnits.add(1);
        }

        if (numUnits.cmp(new Big(0)) === Comparison.GT) {
          const unitString = (durationUnitsMap && durationUnitsMap[unit]) || unit;
          usedNumUnits++;
          return result + numUnits.toFixed(0) + unitString;
        }
      }

      return result;
    }, '');

    return reducedValue || (toNumber(saveValue) > 0 ? '0' : '');
  }

  return saveValue;
}
