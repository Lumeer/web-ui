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
import {columnConstraintType, TableColumn, TableColumnGroup} from './table-column';
import {TableRow} from './table-row';
import {ConstraintType} from '../../../core/model/data/constraint';

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
  row?: TableRow
): boolean {
  if (!selectedCell || !column || selectedCell.type !== type) {
    return false;
  }
  if (type === TableCellType.Header || type === TableCellType.Footer) {
    return selectedCell.columnId === column.id;
  }
  return selectedCell.columnId === column.id && selectedCell.rowId === row?.id;
}

export function isTableColumnDirectlyEditable(column: TableColumn): boolean {
  return columnConstraintType(column) === ConstraintType.Boolean;
}

export function numberOfDiffColumnsBefore(index: number, columns: TableColumn[]): number {
  const column = columns[index];
  if (column.collectionId) {
    return columns.slice(0, index).filter(col => !col.attribute || !!col.linkTypeId).length;
  }
  return columns.slice(0, index).filter(col => !col.attribute || !!col.collectionId).length;
}
