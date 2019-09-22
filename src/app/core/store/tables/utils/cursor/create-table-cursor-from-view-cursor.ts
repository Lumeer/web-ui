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
import {TableModel} from '../../table.model';

export function createTableCursorFromViewCursor(viewCursor: ViewCursor, table: TableModel): TableCursor {
  if (!viewCursor || !table) {
    return null;
  }

  const tableId = table.id;
  const partIndex = table.config.parts.findIndex(p => p.collectionId === viewCursor.collectionId);
  if (partIndex < 0) {
    return null;
  }

  const part = table.config.parts[partIndex];

  const columnIndex = part.columns.findIndex(column => column.attributeIds.includes(viewCursor.attributeId));
  if (columnIndex < 0) {
    return null;
  }

  if (!viewCursor.documentId) {
    return {tableId, partIndex, columnPath: [columnIndex]}; // TODO add support for nested attributes
  }

  const rowIndex = table.config.rows.findIndex(row => row.documentId === viewCursor.documentId);
  if (rowIndex < 0) {
    return null;
  }

  return {tableId, partIndex, columnIndex, rowPath: [rowIndex]};
}
