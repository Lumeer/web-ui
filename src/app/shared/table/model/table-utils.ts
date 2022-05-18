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

import {TABLE_HIDDEN_COLUMN_WIDTH, TableCell, TableCellType} from './table-model';
import {columnConstraint, TableColumn, TableColumnGroup} from './table-column';
import {TableRow, TableRowHierarchy, TableRowHierarchyData} from './table-row';
import {TableColumnType, TableConfigPart} from '../../../core/store/tables/table.model';
import {objectsByIdMap} from '../../utils/common.utils';

export function groupTableColumns(columns: TableColumn[]): TableColumnGroup[] {
  return (columns || []).reduce<TableColumnGroup[]>((array, column) => {
    if (column.hidden) {
      if (!array[array.length - 1]?.hiddenColumns?.length) {
        array.push({
          id: column.id,
          color: column.color,
          tableId: column.tableId,
          width: TABLE_HIDDEN_COLUMN_WIDTH,
          hiddenColumns: [],
        });
      }
      array[array.length - 1].hiddenColumns.push(column);
    } else {
      array.push({id: column.id, color: column.color, tableId: column.tableId, column, width: column.width});
    }

    return array;
  }, []);
}

export function flattenTableColumnGroups(groups: TableColumnGroup[]): TableColumn[] {
  return (groups || []).reduce((columns, group) => {
    if (group.column) {
      columns.push(group.column);
    } else if (group.hiddenColumns) {
      columns.push(...group.hiddenColumns);
    }
    return columns;
  }, []);
}

export function isTableCellSelected(
  selectedCell: TableCell,
  column: TableColumn,
  type: TableCellType,
  row: TableRow
): boolean {
  if (!selectedCell || !column || selectedCell.type !== type) {
    return false;
  }
  if (type === TableCellType.Header || type === TableCellType.Footer) {
    return selectedCell.columnId === column.id && selectedCell.tableId === column.tableId;
  }

  return selectedCell.columnId === column.id && selectedCell.rowId === row?.id && selectedCell.tableId === row?.tableId;
}

export function isTableCellAffected(
  editedCell: TableCell,
  column: TableColumn,
  type: TableCellType,
  row: TableRow
): boolean {
  if (!editedCell || !column || editedCell.type !== type) {
    return false;
  }

  const tableCondition = editedCell.tableId !== column.tableId;
  switch (type) {
    case TableCellType.Header:
      return editedCell.columnId === column.id && tableCondition;
    case TableCellType.Body:
      const bodyCondition = editedCell.columnId === column.id && editedCell.rowId !== row?.id;
      if (column.collectionId) {
        return editedCell.documentId === row?.documentId && bodyCondition;
      } else {
        return editedCell.linkId === row?.linkInstanceId && bodyCondition;
      }
    default:
      return false;
  }
}

export function isTableCellEdited(
  editedCell: TableCell,
  column: TableColumn,
  type: TableCellType,
  row: TableRow
): boolean {
  if (!editedCell || !column || editedCell.type !== type) {
    return false;
  }

  const tableCondition = editedCell.tableId === column.tableId;
  switch (type) {
    case TableCellType.Header:
      return editedCell.columnId === column.id && tableCondition;
    case TableCellType.Body:
      return editedCell.columnId === column.id && editedCell.rowId === row?.id && tableCondition;
    default:
      return false;
  }
}

export function isTableColumnDirectlyEditable(column: TableColumn): boolean {
  return columnConstraint(column).isDirectlyEditable;
}

export function numberOfOtherColumnsBefore(index: number, columns: TableColumn[]): number {
  const column = columns[index];
  if (column.collectionId) {
    return columns.slice(0, index).filter(col => !col.attribute || !!col.linkTypeId).length;
  }
  return columns.slice(0, index).filter(col => !col.attribute || !!col.collectionId).length;
}

export function isTablePartEmpty(part: TableConfigPart): boolean {
  return !part.columns.some(
    column =>
      [TableColumnType.COMPOUND, TableColumnType.HIDDEN].includes(column.type) &&
      column.attributeIds &&
      column.attributeIds.length > 0
  );
}

export function createTableRowsHierarchy(rows: TableRow[]): TableRowHierarchyData {
  const tableRowsMap = objectsByIdMap(rows);
  return (rows || []).reduce<TableRowHierarchyData>((map, row, index) => {
    const hasChild = rows[index + 1]?.parentRowId === row.id;
    if (row.parentRowId) {
      const level = map[row.parentRowId]?.level + 1 || 1;
      map[row.id] = {level, hasChild, hasLevelLine: computeHasLevelLine(index, level, tableRowsMap, rows)};
    } else {
      map[row.id] = {level: 0, hasChild}; //
    }

    return map;
  }, {});
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

export function createTableHierarchySvg(hierarchy: TableRowHierarchy): string {
  const width = ((hierarchy?.level || 0) + 1) * 20;
  const height = 37;
  const color = '#A8A7A7FF';
  const elements = [];
  for (let i = 0; i < hierarchy?.level; i++) {
    if (hierarchy.hasLevelLine?.[i]) {
      const x = i * 20 + 10;
      elements[i] = `<line x1="${x}" y1="0" x2="${x}" y2="${height}" style="stroke:${color}; stroke-width:1" />`;
    }
  }
  if (hierarchy.hasChild) {
    elements.push(
      `<line x1="${width - 10}" y1="${height / 2}" x2="${
        width - 10
      }" y2="${height}" style="stroke:${color}; stroke-width:1" />`
    );
  }
  if (hierarchy?.level > 0) {
    elements.push(
      `<path d="M ${width - 30} 0 C ${width - 30} 20, ${width - 10} 20, ${width - 10} ${
        height / 2
      }" stroke="${color}" fill="transparent"/>`
    );
  }
  elements.push(`<circle cx="${width - 10}" cy="${height / 2}" r="4" fill="${color}"/>`);
  return `<svg height="${height}" width="${width}">${elements.join()}</svg>`;
}
