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

import {ViewCursor} from './view-cursor';

export interface ShortenedViewCursor {
  c?: string; // collectionId
  t?: string; // linkTypeId
  d?: string; // documentId
  l?: string; // linkInstanceId
  a?: string; // attributeId
  s?: boolean; // sidebar
  v?: any; // value
}

export function shortenViewCursor(cursor: ViewCursor): ShortenedViewCursor {
  return (
    cursor && {
      c: cursor.collectionId,
      t: cursor.linkTypeId,
      d: cursor.documentId,
      l: cursor.linkInstanceId,
      a: cursor.attributeId,
      s: cursor.sidebar,
      v: cursor.value,
    }
  );
}

export function prolongViewCursor(cursor: ShortenedViewCursor): ViewCursor {
  return (
    cursor && {
      collectionId: cursor.c,
      linkTypeId: cursor.t,
      documentId: cursor.d,
      attributeId: cursor.a,
      linkInstanceId: cursor.l,
      sidebar: cursor.s,
      value: cursor.v,
    }
  );
}

export function stringifyShortenedViewCursor(cursor: ShortenedViewCursor): string {
  return cursor ? JSON.stringify(cursor) : '';
}

export function parseShortenedViewCursor(cursor: string): ShortenedViewCursor {
  try {
    return JSON.parse(cursor);
  } catch (e) {
    return null;
  }
}
