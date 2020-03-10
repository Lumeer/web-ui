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

import {decodeQueryParam, encodeQueryParam} from '../query-param-encoding';
import {
  parseShortenedViewCursor,
  prolongViewCursor,
  shortenViewCursor,
  stringifyShortenedViewCursor,
} from './shortened-view-cursor';

export interface ViewCursor {
  collectionId?: string;
  linkTypeId?: string;
  documentId?: string;
  linkInstanceId?: string;
  attributeId?: string;
}

export function convertViewCursorToString(cursor: ViewCursor): string {
  return encodeQueryParam(stringifyShortenedViewCursor(shortenViewCursor(cursor)));
}

export function convertStringToViewCursor(cursor: string): ViewCursor {
  return prolongViewCursor(parseShortenedViewCursor(decodeQueryParam(cursor)));
}
