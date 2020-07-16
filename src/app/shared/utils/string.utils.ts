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

import {CaseStyle} from '../../core/model/data/constraint-config';
import * as unorm from 'unorm';
import {convertBase} from './number.utils';

export function removeAccent(value: string, lowerCase = true): string {
  return unorm.nfd(lowerCase ? (value || '').toLowerCase() : value || '').replace(/[\u0300-\u036f]/g, '');
}

export function escapeStringForRegex(text: string): string {
  return text.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

export function transformTextBasedOnCaseStyle(text: string, caseStyle: CaseStyle | string): string {
  if (!text) {
    return '';
  }

  switch (caseStyle) {
    case CaseStyle.LowerCase:
      return text.toLocaleLowerCase();
    case CaseStyle.UpperCase:
      return text.toLocaleUpperCase();
    case CaseStyle.TitleCase:
      return transformTextToTitleCase(text);
    case CaseStyle.SentenceCase:
      return transformTextToSentenceCase(text);
    default:
      return text;
  }
}

export function transformTextToTitleCase(text: string): string {
  return text && text.length > 0 ? text.replace(/\w\S*/g, word => word[0].toLocaleUpperCase() + word.substr(1)) : '';
}

export function transformTextToSentenceCase(text: string): string {
  return text
    .split(/([.!?])/g)
    .reduce((previousSentences, sentence) => {
      if (['.', '!', '?'].includes(sentence)) {
        return previousSentences.concat(sentence + ' ');
      }

      const words = sentence
        .trim()
        .split(' ')
        .reduce((allWords, word, index) => allWords.concat(index === 0 ? transformTextToTitleCase(word) : word), []);
      return previousSentences.concat(words.join(' '));
    }, '')
    .trim();
}

export function setCharAt(value: string, position: number, char: string): string {
  return value.substring(0, position) + char + value.substring(position + 1, value.length);
}

export function replaceNbsp(value: string): string {
  return (value || '').replace(/&nbsp;/g, ' ');
}

export function idToReference(id: string): string {
  return convertBase(id, 16, 36);
}

export function truncate(value: string, limit: number = 25, trail: string = '...'): string {
  const stringValue = value || '';
  return stringValue.length > limit ? stringValue.substring(0, limit) + trail : value;
}
