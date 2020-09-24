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

import {DataValue} from './index';
import {LinkConstraintConfig} from '../data/constraint-config';
import {QueryCondition, QueryConditionValue} from '../../store/navigation/query/query';
import {dataValuesMeetConditionByText} from './data-value.utils';

/*
 * Saved value is formatted as 'Link [Text]'
 */
export class LinkDataValue implements DataValue {
  public readonly linkValue: string;
  public readonly titleValue: string;
  public readonly config: LinkConstraintConfig = {};

  constructor(public readonly value: string, public readonly inputValue?: string) {
    const {link, title} = parseLinkValue(value || '');
    this.linkValue = link || '';
    this.titleValue = title || '';
  }

  public format(): string {
    if (this.linkValue) {
      const linkValue = this.linkValue.startsWith('http') ? this.linkValue : `https://${this.linkValue}`;
      return `<a href="${linkValue}" target="_blank">${this.titleValue || this.linkValue}</a>`
    }
    return this.titleValue || '';
  }

  public editValue(): string {
    return formatLinkValue(this.linkValue, this.titleValue);
  }

  public preview(): string {
    return this.format();
  }

  public serialize(): any {
    return formatLinkValue(this.linkValue, this.titleValue);
  }

  public title(): string {
    return this.titleValue || this.linkValue;
  }

  public compareTo(otherValue: LinkDataValue): number {
    return this.title().localeCompare(otherValue.title());
  }

  public copy(newValue?: any): LinkDataValue {
    const value = newValue !== undefined ? newValue : this.value;
    return new LinkDataValue(value);
  }

  public increment(): DataValue {
    return undefined; // not supported
  }

  public decrement(): DataValue {
    return undefined; // not supported
  }

  public isValid(ignoreConfig?: boolean): boolean {
    return !!this.linkValue;
  }

  public meetCondition(condition: QueryCondition, values: QueryConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new LinkDataValue(value.value));
    const formattedValue = this.format().toLowerCase().trim();
    const otherFormattedValues = dataValues.map(dataValue => dataValue.format().toLowerCase().trim());
    return dataValuesMeetConditionByText(condition, formattedValue, otherFormattedValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    return false; // TODO
  }

  public parseInput(inputValue: string): LinkDataValue {
    return new LinkDataValue(inputValue, inputValue);
  }

  public valueByCondition(condition: QueryCondition, values: QueryConditionValue[]): any {
    return undefined;  // TODO
  }
}

export function formatLinkValue(link: string, title: string): string {
  if (link && title) {
    return `${link} [${title}]`;
  } else if (link || title) {
    return link || title;
  }
  return '';
}

export function parseLinkValue(value: string): { link?: string, title?: string } {
  if (value[value.length - 1] === ']') {
    const titleStartIndex = value.lastIndexOf('[');
    if (titleStartIndex !== -1) {
      return {
        link: value.substring(0, titleStartIndex).trim(),
        title: value.substring(titleStartIndex + 1, value.length - 1)
      };
    }
  }
  return {link: value};
}
