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

import {TableColumn} from './table-column';
import {TableRow} from './table-row';

export const TABLE_ROW_HEIGHT = 37;
export const TABLE_COLUMN_WIDTH = 100;
export const TABLE_HIDDEN_COLUMN_WIDTH = 18;

export interface TableModel {
  id: string;
  collectionId: string;
  columns: TableColumn[];
  rows: TableRow[];
}

export interface SelectedTableCell extends TableCell {}

export interface EditedTableCell extends TableCell {
  inputValue: any;
}

export interface TableCell {
  tableId: string;
  columnId: string;
  type: TableCellType;
  rowId?: string;
}

export enum TableCellType {
  Header = 'header',
  Body = 'body',
  Footer = 'footer',
}
