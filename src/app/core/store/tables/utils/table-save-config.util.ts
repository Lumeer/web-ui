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
import {TableConfig, TableConfigColumn, TableConfigPart, TableConfigRow} from '../table.model';

export function createTableSaveConfig(config: TableConfig): TableConfig {
  return (
    config && {
      parts: createTableSaveConfigParts(config.parts),
      rows: createTableSaveConfigRows(config.rows),
    }
  );
}

function createTableSaveConfigParts(parts: TableConfigPart[]): TableConfigPart[] {
  return parts && parts.map(part => ({...part, columns: filterOutLastUninitializedTableColumns(part.columns)}));
}

export function filterOutLastUninitializedTableColumns(columns: TableConfigColumn[]): TableConfigColumn[] {
  const index = [...columns].reverse().findIndex(column => column.attributeIds && column.attributeIds.length > 0);
  return columns.slice(0, columns.length - index);
}

function createTableSaveConfigRows(rows: TableConfigRow[]): TableConfigRow[] {
  // TODO maybe filter out uninitialized linked rows as well
  return filterOutLastUninitializedTableRows(rows);
}

export function filterOutLastUninitializedTableRows(rows: TableConfigRow[]): TableConfigRow[] {
  const index = [...rows].reverse().findIndex(row => !!row.documentId);
  return rows.slice(0, rows.length - index);
}
