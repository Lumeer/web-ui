/*
 * Lumeer: Modern Data Definition and Processing Platform
 *
 * Copyright (C) since 2017 Answer Institute, s.r.o. and/or its affiliates.
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

import {createSelector} from '@ngrx/store';
import {TableBodyCursor, TableCursor} from './table-cursor';
import {DEFAULT_TABLE_ID} from './table.model';
import {findTableRow} from './table.utils';
import {selectTableById} from './tables.state';

export const selectDefaultTable = selectTableById(DEFAULT_TABLE_ID);

export const selectTableConfig = createSelector(selectDefaultTable, table => table && table.config);

export const selectHasNextTableParts = (cursor: TableCursor) => cursor && createSelector(selectTableById(cursor.tableId), table => {
  return table && table.parts && cursor.partIndex < table.parts.length - 1;
});

export const selectTablePart = (cursor: TableCursor) => createSelector(selectTableById(cursor.tableId), table => {
  return table && table.parts && table.parts[cursor.partIndex];
});

export const selectTableRows = (tableId: string) => createSelector(selectTableById(tableId), table => {
  return (table && table.config && table.config.rows) || [];
});

export const selectTableRow = (cursor: TableBodyCursor) => cursor && createSelector(selectTableRows(cursor.tableId), rows => {
  return findTableRow(rows, cursor.rowPath);
});
