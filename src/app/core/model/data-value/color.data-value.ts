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

import {convertHslColorToHex} from '../../../shared/utils/color/convert-hsl-color-to-hex';
import {convertRgbColorToHex} from '../../../shared/utils/color/convert-rgb-color-to-hex';
import {prolongShortHexColor} from '../../../shared/utils/color/prolong-short-hex-color';
import {formatUnknownDataValue} from '../../../shared/utils/data.utils';
import {validDataColors} from '../../../shared/utils/data/valid-data-colors';
import {ColorConstraintConfig} from '../data/constraint-config';
import {DataValue} from './index';
import {escapeHtml, isNotNullOrUndefined, unescapeHtml} from '../../../shared/utils/common.utils';
import {QueryCondition, QueryConditionValue} from '../../store/navigation/query/query';
import {dataValuesMeetConditionByText, valueMeetFulltexts} from './data-value.utils';
import {saturated} from '../../../shared/picker/colors';

export class ColorDataValue implements DataValue {
  public readonly hexCode: string;
  public readonly numberCode: number;

  constructor(
    public readonly value: any,
    public readonly config: ColorConstraintConfig,
    public readonly inputValue?: string
  ) {
    this.hexCode = value || value === 0 ? parseColorHexCode(value) : null;
    this.numberCode = convertColorHexCodeToNumber(this.hexCode);
  }

  public format(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    return this.hexCode || formatUnknownDataValue(this.value);
  }

  public preview(): string {
    return this.format();
  }

  public title(): string {
    return unescapeHtml(this.format());
  }

  public editValue(): string {
    return this.format();
  }

  public serialize(): any {
    return this.hexCode || escapeHtml(this.value);
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return isNotNullOrUndefined(this.inputValue) || !this.value || !!this.hexCode;
  }

  public increment(): ColorDataValue {
    if (!this.hexCode) {
      return null;
    }

    if (this.hexCode === '#ffffff') {
      return new ColorDataValue('#000000', this.config);
    }

    const value = (this.numberCode + 1).toString(16);
    return new ColorDataValue(value, this.config);
  }

  public decrement(): ColorDataValue {
    if (!this.hexCode) {
      return null;
    }

    if (this.hexCode === '#000000') {
      return new ColorDataValue('#ffffff', this.config);
    }

    const value = (this.numberCode - 1).toString(16);
    return new ColorDataValue(value, this.config);
  }

  public compareTo(otherValue: ColorDataValue): number {
    return this.numberCode - otherValue.numberCode;
  }

  public copy(newValue?: any): ColorDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new ColorDataValue(value, this.config);
  }

  public parseInput(inputValue: string): ColorDataValue {
    return new ColorDataValue(inputValue, this.config, inputValue);
  }

  public meetCondition(condition: QueryCondition, values: QueryConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new ColorDataValue(value.value, this.config));
    const formattedValue = this.format().trim().toLowerCase();
    const otherFormattedValues = dataValues.map(dataValue => dataValue.format().trim().toLowerCase());

    return dataValuesMeetConditionByText(condition, formattedValue, otherFormattedValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    const formattedFulltexts = (fulltexts || []).map(fulltext => this.copy(fulltext).format());
    return valueMeetFulltexts(this.format(), formattedFulltexts) || valueMeetFulltexts(this.readableColor(), fulltexts);
  }

  public readableColor(): string {
    const formattedValue = this.format();
    const colorEntry = Object.entries(validDataColors).find(entry => entry[1] === this.hexCode);
    return (colorEntry && colorEntry[0]) || formattedValue;
  }

  public valueByCondition(condition: QueryCondition, values: QueryConditionValue[]): any {
    switch (condition) {
      case QueryCondition.Equals:
        return values[0].value;
      case QueryCondition.NotEquals:
        return saturated.find(color => color !== values[0].value);
      case QueryCondition.IsEmpty:
        return '';
      case QueryCondition.NotEmpty:
        return '#00b388';
      default:
        return '';
    }
  }
}

function parseColorHexCode(rawValue: any): string {
  const value = String(rawValue || '')
    .trim()
    .toLowerCase();

  if (validDataColors[value]) {
    return validDataColors[value];
  } else if (/^#?[0-9a-f]{6}$/.test(value)) {
    return value.startsWith('#') ? value : `#${value}`;
  } else if (/^#?[0-9a-f]{3}$/.test(value)) {
    return prolongShortHexColor(value);
  } else if (/^rgb\([\s]*[0-9]{1,3}[\s]*,[\s]*[0-9]{1,3}[\s]*,[\s]*[0-9]{1,3}[\s]*\)$/.test(value)) {
    return convertRgbColorToHex(value);
  } else if (/^hsl\([\s]*[0-9]{1,3}[\s]*,[\s]*[0-9]{1,3}[\s]%*,[\s]*[0-9]{1,3}%[\s]*\)$/.test(value)) {
    return convertHslColorToHex(value);
  } else {
    return '';
  }
}

function convertColorHexCodeToNumber(hexCode: string): number {
  return hexCode && parseInt(hexCode.slice(1), 16);
}
