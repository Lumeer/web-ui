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

import {Attribute} from '../../../core/store/collections/collection';
import {ConstraintType} from '../../../core/model/data/constraint';
import {AttributeSortType} from '../../../core/store/views/view';

export interface TableColumnGroup {
  id: string;
  width: number;
  color: string;
  tableId: string;
  hiddenColumns?: TableColumn[];
  column?: TableColumn;
}

export interface TableColumn {
  id: string;
  width: number;
  tableId?: string;
  attribute?: Attribute;
  name?: string;
  creating?: boolean;
  linkTypeId?: string;
  collectionId?: string;
  color?: string;
  default?: boolean;
  hidden?: boolean;
  editable: boolean;
  manageable?: boolean;
  sort?: AttributeSortType;
  menuItems: TableContextMenuItem[];
}

export interface TableContextMenuItem {
  id: string;
  title: string;
  iconClass: string;
  group: number;
  shortcut?: string;
  disabled: boolean;
}

export function columnConstraintType(column: TableColumn): ConstraintType {
  return column.attribute?.constraint?.type || ConstraintType.Unknown;
}
