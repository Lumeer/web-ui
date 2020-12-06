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
import {dataValuesMeetConditionByText, valueByConditionText} from './data-value.utils';
import {ConditionType, ConditionValue} from '../attribute-filter';

/*
 * Saved value is formatted as 'Link [Text]'
 */
export class LinkDataValue implements DataValue {
  public readonly linkValue: string;
  public readonly titleValue: string;

  constructor(
    public readonly value: string,
    public readonly config: LinkConstraintConfig,
    public readonly inputValue?: string
  ) {
    const {link, title} = parseLinkValue(inputValue || value || '');
    this.linkValue = link || '';
    this.titleValue = title || '';
  }

  public format(): string {
    if (this.linkValue) {
      return `<a href="${completeLinkValue(this.linkValue)}" target="_blank">${this.titleValue || this.linkValue}</a>`;
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
    return new LinkDataValue(value, this.config);
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

  public meetCondition(condition: ConditionType, values: ConditionValue[]): boolean {
    const dataValues = (values || []).map(value => new LinkDataValue(value.value, this.config));
    const formattedValue = this.format().toLowerCase().trim();
    const otherFormattedValues = dataValues.map(dataValue => dataValue.format().toLowerCase().trim());
    return dataValuesMeetConditionByText(condition, formattedValue, otherFormattedValues);
  }

  public meetFullTexts(fulltexts: string[]): boolean {
    const linkFormattedValue = this.linkValue?.toLowerCase().toString() || '';
    const titleFormattedValue = this.titleValue?.toLowerCase().toString() || '';
    return (fulltexts || [])
      .map(fulltext => fulltext.toLowerCase().trim())
      .every(fulltext => linkFormattedValue.includes(fulltext) || titleFormattedValue.includes(fulltext));
  }

  public parseInput(inputValue: string): LinkDataValue {
    return new LinkDataValue(inputValue, this.config, inputValue);
  }

  public valueByCondition(condition: ConditionType, values: ConditionValue[]): any {
    return valueByConditionText(condition, values?.[0]?.value);
  }
}

export function completeLinkValue(link: string): string {
  if (link) {
    return linkHasValidProtocol(link) ? link : `https://${link}`;
  }
  return '';
}

export function linkHasValidProtocol(link: string) {
  // https://en.wikipedia.org/wiki/List_of_URI_schemes
  const protocols = [
    'http://',
    'https://',
    'ftp://',
    'mailto:',
    'callto:',
    'spotify:',
    'bitcoin:',
    'dns:',
    'facetime:',
    'file://',
    'geo:',
    'git://',
    'imap://',
    'lastfm://',
    'market://',
    'pop://',
    'imap://',
    's3://',
    'sftp://',
    'skype:',
    'sms:',
    'ssh://',
    'svn://',
    'tag:',
    'tel:',
    'slack://',
    'zoommtg://',
    'app://',
  ];
  return protocols.some(protocol => (link || '').startsWith(protocol));
}

export function formatLinkValue(link: string, title: string): string {
  if (link && title) {
    return `${link} [${title}]`;
  } else if (link || title) {
    return link || title;
  }
  return '';
}

export function parseLinkValue(value: string): {link?: string; title?: string} {
  if (value && value[value.length - 1] === ']') {
    const titleStartIndex = value.lastIndexOf('[');
    if (titleStartIndex !== -1) {
      return {
        link: value.substring(0, titleStartIndex).trim(),
        title: value.substring(titleStartIndex + 1, value.length - 1),
      };
    }
  }
  return {link: value};
}
