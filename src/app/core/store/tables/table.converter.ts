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

import {
  TableColumn,
  TableColumnType,
  TableCompoundColumn,
  TableConfig,
  TableConfigColumn,
  TableConfigPart,
  TableHiddenColumn,
  TableModel,
  TablePart,
} from './table.model';

export function convertTableToConfig(table: TableModel): TableConfig {
  if (!table) {
    return null;
  }

  return {
    parts: convertTablePartsToConfig(table.parts),
    rows: table.config.rows,
  };
}

export function convertTablePartsToConfig(parts: TablePart[]): TableConfigPart[] {
  return parts.map(part => convertTablePartToConfig(part));
}

function convertTablePartToConfig(part: TablePart): TableConfigPart {
  const columns: TableConfigColumn[] = part.columns.map(column => convertTableColumnToConfig(column));

  return {
    collectionId: part.collectionId,
    linkTypeId: part.linkTypeId,
    columns,
  };
}

function convertTableColumnToConfig(column: TableColumn): TableConfigColumn {
  if (column.type === TableColumnType.COMPOUND) {
    const compoundColumn = column as TableCompoundColumn;
    return {
      type: compoundColumn.type,
      attributeIds: [compoundColumn.parent.attributeId],
      width: compoundColumn.parent.width,
      children: compoundColumn.children.map(child => convertTableColumnToConfig(child)),
    };
  }

  if (column.type === TableColumnType.HIDDEN) {
    return {
      type: column.type,
      attributeIds: (column as TableHiddenColumn).attributeIds,
    };
  }

  throw Error('Unknown column type');
}
