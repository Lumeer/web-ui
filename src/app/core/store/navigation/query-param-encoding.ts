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
import * as CRC32 from 'crc-32';
import {Base64} from 'js-base64';

import {padStart} from '../../../shared/utils/string.utils';

export function encodeQueryParam(param: string): string {
  if (!param || param === '{}') {
    return '';
  }

  const base64 = Base64.encode(param, true);
  const crc = calculateQueryCRC(base64);
  return base64 + crc;
}

export function decodeQueryParam(param: string): string {
  if (!param) {
    return '';
  }

  const base64 = param.slice(0, -8);
  const crc = param.slice(-8);

  if (calculateQueryCRC(base64) !== crc) {
    return '';
  }

  try {
    return Base64.decode(base64);
  } catch (e) {
    return '';
  }
}

function calculateQueryCRC(query: string): string {
  const crcNumber = CRC32.str(query) + Math.pow(16, 8) / 2;
  return padStart(crcNumber.toString(16), 8, '0');
}
