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

import {formatUnknownDataValue, stripTextHtmlTags} from '../../../shared/utils/data.utils';
import {replaceNbsp, transformTextBasedOnCaseStyle} from '../../../shared/utils/string.utils';
import {TextConstraintConfig} from '../data/constraint-config';
import {DataValue} from './index';
import {escapeHtml, isNotNullOrUndefined, unescapeHtml} from '../../../shared/utils/common.utils';
import {QueryCondition, QueryConditionValue} from '../../store/navigation/query/query';
import {dataValuesMeetConditionByText, valueByConditionText} from './data-value.utils';

export class TextDataValue implements DataValue {
  constructor(
    public readonly value: any,
    public readonly config: TextConstraintConfig,
    public readonly inputValue?: string
  ) {}

  public format(): string {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.inputValue;
    }

    if (typeof this.value !== 'string') {
      return formatUnknownDataValue(this.value, true);
    }
    return transformTextBasedOnCaseStyle(this.value, this.config && this.config.caseStyle);
  }

  public preview(): string {
    return stripTextHtmlTags(this.format());
  }

  public title(): string {
    return stripTextHtmlTags(this.format(), false);
  }

  public editValue(): string {
    return this.format();
  }

  public serialize(): any {
    const formattedValue = this.format();
    if (numberOfPTags(formattedValue) === 1 && numberOfTags(formattedValue) === 1) {
      return stripTextHtmlTags(formattedValue, false);
    }
    return formattedValue;
  }

  public isValid(ignoreConfig?: boolean): boolean {
    if (isNotNullOrUndefined(this.inputValue)) {
      return this.copy(this.inputValue).isValid(ignoreConfig);
    }

    if (!this.value || ignoreConfig) {
      return true;
    }

    if (this.config) {
      const strippedValue = stripTextHtmlTags(this.value, false);
      if (this.config.minLength && strippedValue.length < this.config.minLength) {
        return false;
      }
      if (this.config.maxLength && strippedValue.length > this.config.maxLength) {
        return false;
      }
    }

    return true;
  }

  public increment(): TextDataValue {
    return undefined; // not supported
  }

  public decrement(): TextDataValue {
    return undefined; // not supported
  }

  public compareTo(otherValue: TextDataValue): number {
    return stripTextHtmlTags(this.format(), false).localeCompare(stripTextHtmlTags(otherValue.format(), false));
  }

  public copy(newValue?: any): TextDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new TextDataValue(value, this.config);
  }

  public parseInput(inputValue: string): TextDataValue {
    return new TextDataValue(inputValue, this.config, replaceNbsp(inputValue));
  }

  public meetCondition(condition: QueryCondition, values: QueryConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new TextDataValue(value.value, this.config));
    const formattedValue = stripTextHtmlTags(this.format(), false).toLowerCase().trim();
    const otherFormattedValues = dataValues.map(dataValue =>
      stripTextHtmlTags(dataValue.format(), false).toLowerCase().trim()
    );
    return dataValuesMeetConditionByText(condition, formattedValue, otherFormattedValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    const formattedValue = stripTextHtmlTags(this.format(), false).toLowerCase().trim();
    return (fulltexts || [])
      .map(fulltext => stripTextHtmlTags(fulltext, false).toLowerCase().trim())
      .every(fulltext => formattedValue.includes(fulltext));
  }

  public valueByCondition(condition: QueryCondition, values: QueryConditionValue[]): any {
    return valueByConditionText(condition, values[0] && stripTextHtmlTags(values[0].value, false));
  }
}

function numberOfTags(value: string): number {
  const match = value.match(/<([a-z]+)([0-9]*)(?=[\s>])(?:[^>=]|='[^']*'|="[^"]*"|=[^'"\s]*)*\s?\/?>/g);
  return match ? match.length : 0;
}

export function numberOfPTags(value: string): number {
  const match = value.match(/<p.*?>.+?<\/p>/g);
  return match ? match.length : 0;
}
