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

import {TableRow, TableRowWithData} from './table-row';
import {objectsByIdMap} from '../../utils/common.utils';

export interface TableRowHierarchy {
  level: number;
  parentsHasChildBelow?: boolean[];
  hasChild?: boolean;
}

export type TableRowHierarchyData = Record<string, TableRowHierarchy>;

export function sortAndFilterTableRowsByHierarchy(rows: TableRow[]): TableRowWithData[] {
  const rowsMap = createRowsMapByParentId(rows);
  const sortedRows = createRowsFromRowsMap(null, rowsMap);
  const hierarchyData = createTableRowsHierarchy(sortedRows, createRowChildrenMap(rows));
  return sortedRows.map(row => ({...row, hierarchy: hierarchyData[row.id]}));
}

function createRowsMapByParentId(rows: TableRow[]): Record<string, TableRow[]> {
  return (rows || []).reduce((map, row) => {
    const parentId = row.parentRowId || null;
    const siblingRows = map[parentId] || [];
    map[parentId] = siblingRows.concat(row);
    return map;
  }, {});
}

function createRowChildrenMap(rows: TableRow[]): Record<string, TableRow[]> {
  return (rows || []).reduce((map, row) => {
    if (!row.parentRowId) {
      return map;
    }
    if (!map[row.parentRowId]) {
      map[row.parentRowId] = [];
    }
    map[row.parentRowId].push(row);
    return map;
  }, {});
}

function createRowsFromRowsMap(parentId: string, rowsMap: Record<string, TableRow[]>): TableRow[] {
  const rows = rowsMap[parentId] || [];
  return rows.reduce((orderedRows, row) => {
    orderedRows.push(row);
    if (row.expanded) {
      orderedRows.push(...createRowsFromRowsMap(row.id, rowsMap));
    }
    return orderedRows;
  }, []);
}

export function createTableRowsHierarchy(
  rows: TableRow[],
  rowsMapByParentId: Record<string, TableRow[]>
): TableRowHierarchyData {
  const tableRowsMap = objectsByIdMap(rows);

  // we know that rows are already sorted by hierarchy
  const result = (rows || []).reduce<{data: TableRowHierarchyData; hasHierarchy: boolean}>(
    (partialResult, row, index) => {
      const hasChild = rowsMapByParentId[row.id]?.length > 0;

      if (row.parentRowId) {
        partialResult.hasHierarchy = true;
        const parentRow = tableRowsMap[row.parentRowId];
        const parentData = partialResult.data[row.parentRowId];
        if (parentRow?.expanded && parentData) {
          const level = partialResult.data[row.parentRowId]?.level + 1 || 1;
          partialResult.data[row.id] = {
            level,
            hasChild,
            parentsHasChildBelow: computeHasLevelLine(index, level, tableRowsMap, rows),
          };
        }
      } else {
        partialResult.data[row.id] = {level: 0, hasChild}; //
      }

      if (hasChild) {
        partialResult.hasHierarchy = true;
      }

      return partialResult;
    },
    {data: {}, hasHierarchy: false}
  );

  if (result.hasHierarchy) {
    return result.data;
  }
  return {};
}

function computeHasLevelLine(
  index: number,
  rowLevel: number,
  map: Record<string, TableRow>,
  rows: TableRow[]
): boolean[] {
  let currentRow = rows[index];
  const rowsUnderRow = rows.slice(index + 1);
  const hasLevelLine = [];
  for (let i = rowLevel - 1; i >= 0; i--) {
    if (currentRow) {
      hasLevelLine[i] = rowsUnderRow.some(row => row.parentRowId === currentRow.parentRowId);
      currentRow = map[currentRow.parentRowId];
    }
  }

  return hasLevelLine;
}

export function createTableHierarchyPath(row: TableRowWithData, height: number, stepWidth: number): string {
  if (!row?.hierarchy) {
    return '';
  }

  const width = ((row.hierarchy.level || 0) + 1) * stepWidth;
  const paths = [];
  for (let i = 0; i < row.hierarchy.level; i++) {
    if (row.hierarchy.parentsHasChildBelow?.[i]) {
      const x = i * stepWidth + stepWidth / 2;
      paths.push(`M ${x} 0 L ${x} ${height}`);
    }
  }
  if (row.hierarchy.hasChild && row.expanded) {
    paths.push(`M ${width - stepWidth / 2} ${height / 2} L ${width - stepWidth / 2} ${height}`);
  }

  if (row.hierarchy.level > 0) {
    const m = width - (stepWidth / 2) * 3;
    paths.push(`M ${m} 0 C ${m} 0, ${m} 20, ${width - stepWidth / 2} ${height / 2}`);
  }

  return paths.join('\n');
}
