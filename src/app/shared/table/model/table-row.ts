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

import {MenuItem} from '../../menu/model/menu-item';
import {AttributeLockFiltersStats} from '@lumeer/data-filters';
import {TableRowHierarchy} from './table-hierarchy';

export interface TableRow {
  id: string;
  tableId: string;
  height: number;
  parentRowId?: string;
  level?: number;
  expanded?: boolean;
  creating?: boolean;
  documentId?: string;
  cellsMap?: TableRowCellsMap; // columnId -> string
  linkInstanceId?: string;
  linkedDocumentId?: string; // used for newly created row
  correlationId?: string;
  commentsCount?: number;
  documentEditable: boolean;
  linkEditable: boolean;
  suggestLinks: boolean;
  suggestDetail: boolean;
  documentMenuItems: MenuItem[];
  linkMenuItems: MenuItem[];
}

export interface TableRowWithData extends TableRow {
  hierarchy?: TableRowHierarchy;
}

export type TableRowCellsMap = Record<string, TableRowCell>;

export interface TableRowCell {
  data: any;
  editable: boolean;
  lockStats: AttributeLockFiltersStats;
  background?: string;
  color?: string;
  classes?: string;
}
