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

import Big from 'big.js';
import {isNullOrUndefined} from './common.utils';
import {Workspace} from '../../core/store/navigation/workspace';

const formattingTags = [
  'strong',
  'em',
  'i',
  'sup',
  'sub',
  'u',
  'strike',
  's',
  'del',
  'cite',
  'code',
  'b',
  'span',
  'p',
  'br',
];

export function stripTextHtmlTags(text: string, keepFormattingTags: boolean = true): string {
  const htmlWithoutTags = keepFormattingTags
    ? stripFormattingHtmlTags(text, true)
    : stripFormattingHtmlTags(text)
        .replace(/<(?:.|\s)*?>/g, ' ')
        .trim();

  return htmlWithoutTags.replace(/class=".*?"/g, '');
}

function stripFormattingHtmlTags(text: string, negative?: boolean): string {
  const negativePart = negative ? '?!' : '';
  return (text || '')
    .replace(new RegExp(`<(${negativePart}\/?(${formattingTags.join('|')})\s*\/?)[^>]*>`, 'g'), negative ? ' ' : '')
    .trim();
}

export function formatUnknownDataValue(value: any, skipDecimal = false): string {
  if (value || value === 0) {
    if (!skipDecimal && !isNaN(+value)) {
      return decimalStoreToUser(String(value));
    }

    return String(value);
  }

  return '';
}

const separator = (1.1).toLocaleString(window.navigator.language).substring(1, 2);

export function decimalUserToStore(value: string): string {
  return separator === '.' ? value : value.replace(separator, '.');
}

export function decimalStoreToUser(value: string): string {
  return separator === '.' ? value : value.replace('.', separator);
}

export function convertToBig(value: any): Big {
  if (isNullOrUndefined(value) || value === '') {
    return null;
  }
  try {
    return new Big(decimalUserToStore(String(value)));
  } catch (e) {
    return null;
  }
}

export function replaceWorkspacePathInUrl(url: string, workspace: Workspace): string {
  if (!url || !workspace) {
    return url;
  }

  const urlParts = url.split('/');
  const workspaceIndex = urlParts.indexOf('w');
  if (workspaceIndex === -1) {
    return url;
  }

  if (workspace.organizationCode) {
    urlParts[workspaceIndex + 1] = workspace.organizationCode;
  }
  if (workspace.projectCode) {
    urlParts[workspaceIndex + 2] = workspace.projectCode;
  }

  return urlParts.join('/');
}
