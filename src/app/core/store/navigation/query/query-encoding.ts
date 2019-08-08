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

export function encodeQuery(query: string): string {
  if (!query || query === '{}') {
    return '';
  }

  const base64 = Base64.encode(query, true);
  const crc = calculateQueryCRC(base64);
  return base64 + crc;
}

export function decodeQuery(query: string): string {
  if (!query) {
    return '';
  }

  const base64 = query.slice(0, -8);
  const crc = query.slice(-8);

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
  return crcNumber.toString(16).padStart(8, '0');
}
