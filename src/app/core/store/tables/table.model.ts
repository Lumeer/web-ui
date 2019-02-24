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

export const DEFAULT_TABLE_ID = 'default';

export const DEFAULT_COLUMN_WIDTH = 100;

export interface TableModel {
  id: string;
  linkInstanceId?: string;
  config?: TableConfig;
}

export enum TableColumnType {
  COMPOUND = 'compound',
  HIDDEN = 'hidden',
}

export interface TableConfig {
  parts: TableConfigPart[];
  rows: TableConfigRow[];
}

export interface TableConfigPart {
  collectionId?: string;
  linkTypeId?: string;
  columns: TableConfigColumn[];
  expanded?: boolean;
}

export interface TableConfigColumn {
  type: TableColumnType;
  attributeIds: string[];
  attributeName?: string;
  width?: number;
  children?: TableConfigColumn[];
}

export interface TableConfigRow {
  correlationId?: string;
  documentId?: string;
  linkInstanceId?: string;

  parentDocumentId?: string;

  linkedRows: TableConfigRow[];
  expanded?: boolean;
}
