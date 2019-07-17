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

export function isLastTableRowInitialized(rows: TableConfigRow[]): boolean {
  return rows && rows.length > 0 && !!rows[rows.length - 1].documentId;
}

/**
 * Returns all linked rows for a row specified by rowPath as you would see them in the UI (including rows linked to its
 * siblings if the parent row is collapsed).
 */
export function findLinkedTableRows(rows: TableConfigRow[], rowPath: number[]): TableConfigRow[] {
  if (rowPath.length === 0) {
    return rows;
  }

  const [rowIndex, ...childPath] = rowPath;
  const row = rows[rowIndex];

  if (!row) {
    return [];
  }

  if (row.linkedRows.length > 1 && !row.expanded) {
    return findAllLinkedTableRowsByLevel(row.linkedRows, childPath.length);
  }

  return findLinkedTableRows(row.linkedRows, childPath);
}

function findAllLinkedTableRowsByLevel(rows: TableConfigRow[], level: number): TableConfigRow[] {
  if (level <= 0) {
    return rows;
  }

  return findAllLinkedTableRowsByLevel(
    rows.reduce((linkedRows, row) => {
      linkedRows.push(...row.linkedRows);
      return linkedRows;
    }, []),
    level - 1
  );
}

export interface RowWithPath {
  path: number[];
  row: TableConfigRow;
}

/**
 * Returns all rows by the given rowPath as they are seen in the UI (including all collapsed rows).
 */
export function findTableRowsIncludingCollapsed(rows: TableConfigRow[], rowPath: number[]): RowWithPath[] {
  const [rowIndex, ...childPath] = rowPath;
  const row = rows[rowIndex];

  if (!row) {
    return [];
  }

  if (childPath.length === 0) {
    return [{path: [rowIndex], row}];
  }

  if (row.linkedRows.length > 1 && !row.expanded) {
    const linkedRows: RowWithPath[] = row.linkedRows.map((linkedRow, index) => ({
      path: [rowIndex, index],
      row: linkedRow,
    }));
    return findAllTableRowsByLevel(linkedRows, childPath.length);
  }

  return findTableRowsIncludingCollapsed(row.linkedRows, childPath).map(rowWithPath => ({
    ...rowWithPath,
    path: [rowIndex, ...rowWithPath.path],
  }));
}

function findAllTableRowsByLevel(rows: RowWithPath[], level: number): RowWithPath[] {
  if (level <= 1) {
    return rows;
  }

  return findAllTableRowsByLevel(
    rows.reduce((linkedRows, row) => {
      row.row.linkedRows.forEach((linkedRow, index) => linkedRows.push({path: row.path.concat(index), row: linkedRow}));
      return linkedRows;
    }, []),
    level - 1
  );
}
