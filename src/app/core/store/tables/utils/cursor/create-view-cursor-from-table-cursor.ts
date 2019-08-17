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

import {ViewCursor} from '../../../navigation/view-cursor/view-cursor';
import {TableCursor} from '../../table-cursor';
import {TableColumnType, TableModel} from '../../table.model';
import {findTableRow} from '../../table.utils';

export function createViewCursorFromTableCursor(cursor: TableCursor, table: TableModel): ViewCursor {
  if (!cursor || !cursor.rowPath) {
    return null;
  }

  const part = table.config && table.config.parts && table.config.parts[cursor.partIndex];
  if (!part || (!part.collectionId && !part.linkTypeId)) {
    return null;
  }

  const column = part.columns[cursor.columnIndex];
  if (column.type !== TableColumnType.COMPOUND) {
    return null;
  }

  const [attributeId] = column.attributeIds;
  const row = findTableRow(table.config.rows, cursor.rowPath);
  if (!row || !row.documentId) {
    return null;
  }

  if (cursor.partIndex > 0) {
    const primaryRow = findTableRow(table.config.rows, cursor.rowPath.slice(0, 1));
    return {
      collectionId: part.collectionId,
      documentId: primaryRow.documentId,
    };
  }

  return {
    collectionId: part.collectionId,
    documentId: row.documentId,
    attributeId,
  };
}
