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
import {TableConfigRow} from '../table.model';

export function isTableRowExpanded(rows: TableConfigRow[], rowPath: number[]): boolean {
  if (rowPath.length === 0) {
    return true;
  }

  const [index, ...childPath] = rowPath;
  const row = rows[index];

  if (childPath.length === 0) {
    return row.expanded || row.linkedRows.length < 2;
  }

  return !!row && row.expanded && isTableRowExpanded(row.linkedRows, childPath);
}

export function isTableRowCollapsed(rows: TableConfigRow[], rowPath: number[]): boolean {
  const [index, ...childPath] = rowPath;
  const row = rows && rows[index];

  if (!row) {
    return false;
  }

  // row is collapsed if some of the previously linked rows is collapsed
  return (
    (!row.expanded && (row.linkedRows || []).length > 1) ||
    (rowPath.length > 1 && isTableRowCollapsed(row.linkedRows, childPath))
  );
}
